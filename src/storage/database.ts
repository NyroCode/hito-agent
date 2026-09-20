import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { check } from '../domain/errors.ts';
import { digest,text } from '../domain/primitives.ts';
export class Database {
  db:DatabaseSync;
  constructor(path:string) {
    if(path!==':memory:') mkdirSync(dirname(path),{recursive:true,mode:0o700});
    this.db=new DatabaseSync(path);this.db.exec(`
      PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS documents(kind TEXT NOT NULL,id TEXT NOT NULL,project_id TEXT NOT NULL,body TEXT NOT NULL,PRIMARY KEY(kind,id));
      CREATE TABLE IF NOT EXISTS idempotency(scope TEXT NOT NULL,k TEXT NOT NULL,input_hash TEXT NOT NULL,response TEXT NOT NULL,PRIMARY KEY(scope,k));
      CREATE TABLE IF NOT EXISTS audit(seq INTEGER PRIMARY KEY AUTOINCREMENT,at INTEGER NOT NULL,actor TEXT NOT NULL,action TEXT NOT NULL,project_id TEXT NOT NULL,object_id TEXT NOT NULL,input_hash TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS source_locks(source TEXT PRIMARY KEY,intent_id TEXT NOT NULL UNIQUE);
      PRAGMA user_version=1;
    `);
  }
  close(){this.db.close();}
  get<T>(kind:string,id:string):T|null {const r=this.db.prepare('SELECT body FROM documents WHERE kind=? AND id=?').get(kind,id) as {body:string}|undefined;return r?JSON.parse(r.body):null;}
  put(kind:string,id:string,projectId:string,value:unknown){this.db.prepare('INSERT INTO documents(kind,id,project_id,body) VALUES(?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET body=excluded.body,project_id=excluded.project_id').run(kind,id,projectId,JSON.stringify(value));}
  list<T>(kind:string,projectId?:string):T[]{const rs=projectId?this.db.prepare('SELECT body FROM documents WHERE kind=? AND project_id=? ORDER BY rowid').all(kind,projectId):this.db.prepare('SELECT body FROM documents WHERE kind=? ORDER BY rowid').all(kind);return rs.map(r=>JSON.parse(String(r.body)));}
  transaction<T>(fn:()=>T):T {this.db.exec('BEGIN IMMEDIATE');try{const r=fn();this.db.exec('COMMIT');return r;}catch(e){this.db.exec('ROLLBACK');throw e;}}
  once<T>(scope:string,key:string,input:unknown,fn:()=>T):T {
    text(key,'Idempotency-Key',120);const h=digest(input);
    return this.transaction(()=>{const r=this.db.prepare('SELECT input_hash,response FROM idempotency WHERE scope=? AND k=?').get(scope,key) as {input_hash:string;response:string}|undefined;
      if(r){check(r.input_hash===h,'IDEMPOTENCY_CONFLICT','Key already used with a different input',409);return JSON.parse(r.response);}
      const out=fn();this.db.prepare('INSERT INTO idempotency VALUES(?,?,?,?)').run(scope,key,h,JSON.stringify(out));return out;});
  }
  audit(actor:string,action:string,projectId:string,objectId:string,input:unknown) { this.db.prepare('INSERT INTO audit(at,actor,action,project_id,object_id,input_hash) VALUES(?,?,?,?,?,?)').run(Math.floor(Date.now()/1000),actor,action,projectId,objectId,digest(input)); }
  acquire(source:string,intent:string){const r=this.db.prepare('SELECT intent_id FROM source_locks WHERE source=?').get(source);check(!r||r.intent_id===intent,'SOURCE_BUSY','This wallet has an unresolved transaction. Reconcile it first.',409);this.db.prepare('INSERT OR IGNORE INTO source_locks VALUES(?,?)').run(source,intent);}
  unlock(source:string,intent:string){this.db.prepare('DELETE FROM source_locks WHERE source=? AND intent_id=?').run(source,intent);}
}
