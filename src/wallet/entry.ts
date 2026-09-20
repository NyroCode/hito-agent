import { requestAccess,getNetworkDetails,signTransaction } from '@stellar/freighter-api';
const TESTNET='Test SDF Network ; September 2015';
export async function signIntent(intent:{source:string;unsignedXdr:string;expiresAt:number}):Promise<string>{
  if(intent.expiresAt<=Math.floor(Date.now()/1000))throw new Error('Expired intent; do not sign');
  const access=await requestAccess();if(access.error)throw new Error('Freighter access denied');
  if(access.address!==intent.source)throw new Error('Switch Freighter to the public account requested by this intent');
  const network=await getNetworkDetails();if(network.error||network.networkPassphrase!==TESTNET)throw new Error('Freighter must be on TESTNET');
  const result=await signTransaction(intent.unsignedXdr,{networkPassphrase:TESTNET,address:intent.source});
  if(result.error||!result.signedTxXdr||result.signerAddress!==intent.source)throw new Error('Signature rejected or wrong account');
  return result.signedTxXdr;
}
export async function getConnectedAddress():Promise<string>{
  const access=await requestAccess();if(access.error)throw new Error('Freighter access denied: '+(access.error.message||access.error));
  return access.address;
}
