use super::*;
use soroban_sdk::{testutils::{Address as _,Ledger}, vec};
struct F { e:Env,c:Address,t:Address,p:Address,q:Address,w:BytesN<32>,h:BytesN<32> }
fn fixture()->F {
    let e=Env::default();e.mock_all_auths();e.ledger().with_mut(|li|li.timestamp=100);
    let p=Address::generate(&e);let q=Address::generate(&e);let admin=Address::generate(&e);
    let t=e.register_stellar_asset_contract_v2(admin).address();
    token::StellarAssetClient::new(&e,&t).mint(&p,&1000);
    let c=e.register(HitoEscrow,(t.clone(),));
    let w=BytesN::from_array(&e,&[1;32]);let h=BytesN::from_array(&e,&[2;32]);F{e,c,t,p,q,w,h}
}
fn create(f:&F){HitoEscrowClient::new(&f.e,&f.c).create(&f.w,&f.p,&f.q,&f.h,&vec![&f.e,40i128,60i128],&vec![&f.e,0u32,1u32],&1000u64);}
fn funded(f:&F){create(f);let c=HitoEscrowClient::new(&f.e,&f.c);c.accept(&f.w,&f.h);c.fund(&f.w);}
fn evidence(f:&F)->BytesN<32>{BytesN::from_array(&f.e,&[3;32])}
#[test] fn full_lifecycle(){let f=fixture();funded(&f);let c=HitoEscrowClient::new(&f.e,&f.c);let h=evidence(&f);for i in 0..2{c.submit(&f.w,&i,&h);c.approve(&f.w,&i,&h);c.release(&f.w,&i,&h);}assert_eq!(token::Client::new(&f.e,&f.t).balance(&f.q),100);assert_eq!(token::Client::new(&f.e,&f.t).balance(&f.p),900);assert!(c.get(&f.w).closed);}
#[test] fn duplicate_create_rejected(){let f=fixture();create(&f);assert!(HitoEscrowClient::new(&f.e,&f.c).try_create(&f.w,&f.p,&f.q,&f.h,&vec![&f.e,1],&vec![&f.e,0],&1000).is_err());}
#[test] fn funding_requires_acceptance(){let f=fixture();create(&f);assert!(HitoEscrowClient::new(&f.e,&f.c).try_fund(&f.w).is_err());}
#[test] fn funding_twice_rejected(){let f=fixture();funded(&f);assert!(HitoEscrowClient::new(&f.e,&f.c).try_fund(&f.w).is_err());}
#[test] fn cannot_release_without_approval(){let f=fixture();funded(&f);let c=HitoEscrowClient::new(&f.e,&f.c);let h=evidence(&f);c.submit(&f.w,&0,&h);assert!(c.try_release(&f.w,&0,&h).is_err());}
#[test] fn cannot_release_twice(){let f=fixture();funded(&f);let c=HitoEscrowClient::new(&f.e,&f.c);let h=evidence(&f);c.submit(&f.w,&0,&h);c.approve(&f.w,&0,&h);c.release(&f.w,&0,&h);assert!(c.try_release(&f.w,&0,&h).is_err());}
#[test] fn cannot_change_approved_evidence(){let f=fixture();funded(&f);let c=HitoEscrowClient::new(&f.e,&f.c);let h=evidence(&f);c.submit(&f.w,&0,&h);c.approve(&f.w,&0,&h);assert!(c.try_submit(&f.w,&0,&f.h).is_err());}
#[test] fn stale_hash_cannot_approve(){let f=fixture();funded(&f);let c=HitoEscrowClient::new(&f.e,&f.c);c.submit(&f.w,&0,&evidence(&f));assert!(c.try_approve(&f.w,&0,&f.h).is_err());}
#[test] fn dependencies_enforced(){let f=fixture();funded(&f);let c=HitoEscrowClient::new(&f.e,&f.c);let h=evidence(&f);c.submit(&f.w,&1,&h);assert!(c.try_approve(&f.w,&1,&h).is_err());}
#[test] fn unilateral_cancel_blocked(){let f=fixture();funded(&f);assert!(HitoEscrowClient::new(&f.e,&f.c).try_cancel(&f.w).is_err());}
#[test] fn bilateral_cancel_refunds(){let f=fixture();funded(&f);let c=HitoEscrowClient::new(&f.e,&f.c);c.request_cancel(&f.w);c.cancel(&f.w);assert_eq!(token::Client::new(&f.e,&f.t).balance(&f.p),1000);assert!(c.get(&f.w).closed);}
#[test] fn approved_balance_cannot_be_cancelled(){let f=fixture();funded(&f);let c=HitoEscrowClient::new(&f.e,&f.c);let h=evidence(&f);c.submit(&f.w,&0,&h);c.approve(&f.w,&0,&h);assert!(c.try_request_cancel(&f.w).is_err());}
#[test] fn expired_empty_delivery_refunds(){let f=fixture();funded(&f);f.e.ledger().with_mut(|li|li.timestamp=1001);let c=HitoEscrowClient::new(&f.e,&f.c);c.refund_expired(&f.w);assert_eq!(token::Client::new(&f.e,&f.t).balance(&f.p),1000);}
#[test] fn expired_submitted_work_protected(){let f=fixture();funded(&f);let c=HitoEscrowClient::new(&f.e,&f.c);c.submit(&f.w,&0,&evidence(&f));f.e.ledger().with_mut(|li|li.timestamp=1001);assert!(c.try_refund_expired(&f.w).is_err());}
#[test] fn future_dependency_rejected(){let f=fixture();let c=HitoEscrowClient::new(&f.e,&f.c);assert!(c.try_create(&f.w,&f.p,&f.q,&f.h,&vec![&f.e,1],&vec![&f.e,1],&1000).is_err());}
#[test] fn zero_amount_rejected(){let f=fixture();let c=HitoEscrowClient::new(&f.e,&f.c);assert!(c.try_create(&f.w,&f.p,&f.q,&f.h,&vec![&f.e,0],&vec![&f.e,0],&1000).is_err());}
#[test] fn sum_overflow_rejected(){let f=fixture();let c=HitoEscrowClient::new(&f.e,&f.c);assert!(c.try_create(&f.w,&f.p,&f.q,&f.h,&vec![&f.e,i128::MAX,1],&vec![&f.e,0,0],&1000).is_err());}
#[test] fn wrong_plan_rejected(){let f=fixture();create(&f);assert!(HitoEscrowClient::new(&f.e,&f.c).try_accept(&f.w,&evidence(&f)).is_err());}
#[test] fn payer_authorization_is_required(){let f=fixture();f.e.mock_auths(&[]);assert!(HitoEscrowClient::new(&f.e,&f.c).try_create(&f.w,&f.p,&f.q,&f.h,&vec![&f.e,1],&vec![&f.e,0],&1000).is_err());}
#[test] fn payee_authorization_is_required(){let f=fixture();create(&f);f.e.mock_auths(&[]);assert!(HitoEscrowClient::new(&f.e,&f.c).try_accept(&f.w,&f.h).is_err());}
#[test] fn approval_requires_payer_auth(){let f=fixture();funded(&f);let c=HitoEscrowClient::new(&f.e,&f.c);c.submit(&f.w,&0,&evidence(&f));f.e.mock_auths(&[]);assert!(c.try_approve(&f.w,&0,&evidence(&f)).is_err());}
#[test] fn release_is_permissionless_after_approval(){let f=fixture();funded(&f);let c=HitoEscrowClient::new(&f.e,&f.c);let h=evidence(&f);c.submit(&f.w,&0,&h);c.approve(&f.w,&0,&h);f.e.mock_auths(&[]);c.release(&f.w,&0,&h);assert_eq!(token::Client::new(&f.e,&f.t).balance(&f.q),40);}
