use super::*;
use soroban_sdk::{
    testutils::{storage::Persistent as _, Address as _, Ledger, MockAuth, MockAuthInvoke},
    vec, IntoVal,
};
struct F {
    e: Env,
    c: Address,
    t: Address,
    p: Address,
    q: Address,
    w: BytesN<32>,
    h: BytesN<32>,
}
fn fixture() -> F {
    fixture_with_auth_mocking(true)
}

fn auth_fixture() -> F {
    fixture_with_auth_mocking(false)
}

fn bare_auth_fixture() -> F {
    let e = Env::default();
    e.ledger().with_mut(|li| li.timestamp = 100);
    let p = Address::generate(&e);
    let q = Address::generate(&e);
    // Auth-only create/accept cases never invoke the asset. An inert address
    // keeps these negative tests completely free of global auth mocking.
    let t = Address::generate(&e);
    let c = e.register(HitoEscrow, (t.clone(),));
    let w = BytesN::from_array(&e, &[1; 32]);
    let h = BytesN::from_array(&e, &[2; 32]);
    F {
        e,
        c,
        t,
        p,
        q,
        w,
        h,
    }
}

fn fixture_with_auth_mocking(mock_all: bool) -> F {
    let e = Env::default();
    e.mock_all_auths();
    e.ledger().with_mut(|li| li.timestamp = 100);
    let p = Address::generate(&e);
    let q = Address::generate(&e);
    let admin = Address::generate(&e);
    let t = e.register_stellar_asset_contract_v2(admin).address();
    token::StellarAssetClient::new(&e, &t).mint(&p, &1000);
    let c = e.register(HitoEscrow, (t.clone(),));
    if !mock_all {
        // Token setup needs issuer auth, but the operation under test starts
        // with all auth mocking disabled and accepts only explicit trees.
        e.set_auths(&[]);
    }
    let w = BytesN::from_array(&e, &[1; 32]);
    let h = BytesN::from_array(&e, &[2; 32]);
    F {
        e,
        c,
        t,
        p,
        q,
        w,
        h,
    }
}

fn create_with(f: &F, wid: &BytesN<32>, amounts: soroban_sdk::Vec<i128>) {
    let mut dependencies = soroban_sdk::Vec::new(&f.e);
    for _ in 0..amounts.len() {
        dependencies.push_back(0);
    }
    HitoEscrowClient::new(&f.e, &f.c).create(
        wid,
        &f.p,
        &f.q,
        &f.h,
        &amounts,
        &dependencies,
        &1000u64,
    );
}

fn create_with_exact_auth(f: &F) {
    let amounts = vec![&f.e, 40i128, 60i128];
    let dependencies = vec![&f.e, 0u32, 1u32];
    HitoEscrowClient::new(&f.e, &f.c)
        .mock_auths(&[MockAuth {
            address: &f.p,
            invoke: &MockAuthInvoke {
                contract: &f.c,
                fn_name: "create",
                args: (
                    f.w.clone(),
                    f.p.clone(),
                    f.q.clone(),
                    f.h.clone(),
                    amounts.clone(),
                    dependencies.clone(),
                    1000u64,
                )
                    .into_val(&f.e),
                sub_invokes: &[],
            },
        }])
        .create(&f.w, &f.p, &f.q, &f.h, &amounts, &dependencies, &1000u64);
}
fn create(f: &F) {
    HitoEscrowClient::new(&f.e, &f.c).create(
        &f.w,
        &f.p,
        &f.q,
        &f.h,
        &vec![&f.e, 40i128, 60i128],
        &vec![&f.e, 0u32, 1u32],
        &1000u64,
    );
}
fn funded(f: &F) {
    create(f);
    let c = HitoEscrowClient::new(&f.e, &f.c);
    c.accept(&f.w, &f.h);
    c.fund(&f.w);
}
fn evidence(f: &F) -> BytesN<32> {
    BytesN::from_array(&f.e, &[3; 32])
}
#[test]
fn full_lifecycle() {
    let f = fixture();
    funded(&f);
    let c = HitoEscrowClient::new(&f.e, &f.c);
    let h = evidence(&f);
    for i in 0..2 {
        c.submit(&f.w, &i, &h);
        c.approve(&f.w, &i, &h);
        c.release(&f.w, &i, &h);
    }
    assert_eq!(token::Client::new(&f.e, &f.t).balance(&f.q), 100);
    assert_eq!(token::Client::new(&f.e, &f.t).balance(&f.p), 900);
    assert!(c.get(&f.w).closed);
}
#[test]
fn duplicate_create_rejected() {
    let f = fixture();
    create(&f);
    assert!(HitoEscrowClient::new(&f.e, &f.c)
        .try_create(
            &f.w,
            &f.p,
            &f.q,
            &f.h,
            &vec![&f.e, 1],
            &vec![&f.e, 0],
            &1000
        )
        .is_err());
}
#[test]
fn funding_requires_acceptance() {
    let f = fixture();
    create(&f);
    assert!(HitoEscrowClient::new(&f.e, &f.c).try_fund(&f.w).is_err());
}
#[test]
fn funding_twice_rejected() {
    let f = fixture();
    funded(&f);
    assert!(HitoEscrowClient::new(&f.e, &f.c).try_fund(&f.w).is_err());
}
#[test]
fn cannot_release_without_approval() {
    let f = fixture();
    funded(&f);
    let c = HitoEscrowClient::new(&f.e, &f.c);
    let h = evidence(&f);
    c.submit(&f.w, &0, &h);
    assert!(c.try_release(&f.w, &0, &h).is_err());
}
#[test]
fn cannot_release_twice() {
    let f = fixture();
    funded(&f);
    let c = HitoEscrowClient::new(&f.e, &f.c);
    let h = evidence(&f);
    c.submit(&f.w, &0, &h);
    c.approve(&f.w, &0, &h);
    c.release(&f.w, &0, &h);
    assert!(c.try_release(&f.w, &0, &h).is_err());
}
#[test]
fn cannot_change_approved_evidence() {
    let f = fixture();
    funded(&f);
    let c = HitoEscrowClient::new(&f.e, &f.c);
    let h = evidence(&f);
    c.submit(&f.w, &0, &h);
    c.approve(&f.w, &0, &h);
    assert!(c.try_submit(&f.w, &0, &f.h).is_err());
}
#[test]
fn stale_hash_cannot_approve() {
    let f = fixture();
    funded(&f);
    let c = HitoEscrowClient::new(&f.e, &f.c);
    c.submit(&f.w, &0, &evidence(&f));
    assert!(c.try_approve(&f.w, &0, &f.h).is_err());
}
#[test]
fn dependencies_enforced() {
    let f = fixture();
    funded(&f);
    let c = HitoEscrowClient::new(&f.e, &f.c);
    let h = evidence(&f);
    c.submit(&f.w, &1, &h);
    assert!(c.try_approve(&f.w, &1, &h).is_err());
}
#[test]
fn unilateral_cancel_blocked() {
    let f = fixture();
    funded(&f);
    assert!(HitoEscrowClient::new(&f.e, &f.c).try_cancel(&f.w).is_err());
}
#[test]
fn bilateral_cancel_refunds() {
    let f = fixture();
    funded(&f);
    let c = HitoEscrowClient::new(&f.e, &f.c);
    c.request_cancel(&f.w);
    c.cancel(&f.w);
    assert_eq!(token::Client::new(&f.e, &f.t).balance(&f.p), 1000);
    assert!(c.get(&f.w).closed);
}
#[test]
fn approved_balance_cannot_be_cancelled() {
    let f = fixture();
    funded(&f);
    let c = HitoEscrowClient::new(&f.e, &f.c);
    let h = evidence(&f);
    c.submit(&f.w, &0, &h);
    c.approve(&f.w, &0, &h);
    assert!(c.try_request_cancel(&f.w).is_err());
}
#[test]
fn expired_empty_delivery_refunds() {
    let f = fixture();
    funded(&f);
    f.e.ledger().with_mut(|li| li.timestamp = 1001);
    let c = HitoEscrowClient::new(&f.e, &f.c);
    c.refund_expired(&f.w);
    assert_eq!(token::Client::new(&f.e, &f.t).balance(&f.p), 1000);
}
#[test]
fn expired_submitted_work_protected() {
    let f = fixture();
    funded(&f);
    let c = HitoEscrowClient::new(&f.e, &f.c);
    c.submit(&f.w, &0, &evidence(&f));
    f.e.ledger().with_mut(|li| li.timestamp = 1001);
    assert!(c.try_refund_expired(&f.w).is_err());
}
#[test]
fn future_dependency_rejected() {
    let f = fixture();
    let c = HitoEscrowClient::new(&f.e, &f.c);
    assert!(c
        .try_create(
            &f.w,
            &f.p,
            &f.q,
            &f.h,
            &vec![&f.e, 1],
            &vec![&f.e, 1],
            &1000
        )
        .is_err());
}
#[test]
fn zero_amount_rejected() {
    let f = fixture();
    let c = HitoEscrowClient::new(&f.e, &f.c);
    assert!(c
        .try_create(
            &f.w,
            &f.p,
            &f.q,
            &f.h,
            &vec![&f.e, 0],
            &vec![&f.e, 0],
            &1000
        )
        .is_err());
}
#[test]
fn sum_overflow_rejected() {
    let f = fixture();
    let c = HitoEscrowClient::new(&f.e, &f.c);
    assert!(c
        .try_create(
            &f.w,
            &f.p,
            &f.q,
            &f.h,
            &vec![&f.e, i128::MAX, 1],
            &vec![&f.e, 0, 0],
            &1000
        )
        .is_err());
}
#[test]
fn wrong_plan_rejected() {
    let f = fixture();
    create(&f);
    assert!(HitoEscrowClient::new(&f.e, &f.c)
        .try_accept(&f.w, &evidence(&f))
        .is_err());
}
#[test]
fn payer_authorization_is_required() {
    let f = bare_auth_fixture();
    assert!(HitoEscrowClient::new(&f.e, &f.c)
        .try_create(
            &f.w,
            &f.p,
            &f.q,
            &f.h,
            &vec![&f.e, 1],
            &vec![&f.e, 0],
            &1000
        )
        .is_err());
}
#[test]
fn payee_authorization_is_required() {
    let f = bare_auth_fixture();
    create_with_exact_auth(&f);
    assert!(HitoEscrowClient::new(&f.e, &f.c)
        .try_accept(&f.w, &f.h)
        .is_err());
}
#[test]
fn approval_requires_payer_auth() {
    let f = fixture();
    funded(&f);
    let c = HitoEscrowClient::new(&f.e, &f.c);
    c.submit(&f.w, &0, &evidence(&f));
    f.e.set_auths(&[]);
    assert!(c.try_approve(&f.w, &0, &evidence(&f)).is_err());
}
#[test]
fn release_is_permissionless_after_approval() {
    let f = fixture();
    funded(&f);
    let c = HitoEscrowClient::new(&f.e, &f.c);
    let h = evidence(&f);
    c.submit(&f.w, &0, &h);
    c.approve(&f.w, &0, &h);
    f.e.set_auths(&[]);
    c.release(&f.w, &0, &h);
    assert_eq!(token::Client::new(&f.e, &f.t).balance(&f.q), 40);
}

#[test]
fn exact_role_auth_trees_allow_create_accept_and_fund() {
    let f = auth_fixture();
    create_with_exact_auth(&f);
    let c = HitoEscrowClient::new(&f.e, &f.c);

    c.mock_auths(&[MockAuth {
        address: &f.q,
        invoke: &MockAuthInvoke {
            contract: &f.c,
            fn_name: "accept",
            args: (f.w.clone(), f.h.clone()).into_val(&f.e),
            sub_invokes: &[],
        },
    }])
    .accept(&f.w, &f.h);

    let transfer = MockAuthInvoke {
        contract: &f.t,
        fn_name: "transfer",
        args: (f.p.clone(), f.c.clone(), 100i128).into_val(&f.e),
        sub_invokes: &[],
    };
    c.mock_auths(&[MockAuth {
        address: &f.p,
        invoke: &MockAuthInvoke {
            contract: &f.c,
            fn_name: "fund",
            args: (f.w.clone(),).into_val(&f.e),
            sub_invokes: &[transfer],
        },
    }])
    .fund(&f.w);

    let work = c.get(&f.w);
    assert!(work.funded);
    assert_eq!(work.remaining, 100);
    assert_eq!(token::Client::new(&f.e, &f.t).balance(&f.c), 100);
}

#[test]
fn authorization_for_wrong_create_arguments_is_rejected() {
    let f = bare_auth_fixture();
    let c = HitoEscrowClient::new(&f.e, &f.c);
    let amounts = vec![&f.e, 40i128, 60i128];
    let dependencies = vec![&f.e, 0u32, 1u32];
    assert!(c
        .mock_auths(&[MockAuth {
            address: &f.p,
            invoke: &MockAuthInvoke {
                contract: &f.c,
                fn_name: "create",
                args: (
                    f.w.clone(),
                    f.p.clone(),
                    f.q.clone(),
                    f.h.clone(),
                    amounts.clone(),
                    dependencies.clone(),
                    999u64,
                )
                    .into_val(&f.e),
                sub_invokes: &[],
            },
        }])
        .try_create(&f.w, &f.p, &f.q, &f.h, &amounts, &dependencies, &1000u64,)
        .is_err());
}

#[test]
fn authorization_from_wrong_role_is_rejected() {
    let f = bare_auth_fixture();
    let c = HitoEscrowClient::new(&f.e, &f.c);
    let amounts = vec![&f.e, 40i128, 60i128];
    let dependencies = vec![&f.e, 0u32, 1u32];
    assert!(c
        .mock_auths(&[MockAuth {
            address: &f.q,
            invoke: &MockAuthInvoke {
                contract: &f.c,
                fn_name: "create",
                args: (
                    f.w.clone(),
                    f.p.clone(),
                    f.q.clone(),
                    f.h.clone(),
                    amounts.clone(),
                    dependencies.clone(),
                    1000u64,
                )
                    .into_val(&f.e),
                sub_invokes: &[],
            },
        }])
        .try_create(&f.w, &f.p, &f.q, &f.h, &amounts, &dependencies, &1000u64,)
        .is_err());
}

#[test]
fn failed_token_transfer_rolls_back_funding_state() {
    let f = fixture();
    let c = HitoEscrowClient::new(&f.e, &f.c);
    create_with(&f, &f.w, vec![&f.e, 1001i128]);
    c.accept(&f.w, &f.h);

    assert!(c.try_fund(&f.w).is_err());
    let work = c.get(&f.w);
    assert!(work.accepted);
    assert!(!work.funded);
    assert_eq!(work.remaining, 0);
    assert_eq!(token::Client::new(&f.e, &f.t).balance(&f.p), 1000);
    assert_eq!(token::Client::new(&f.e, &f.t).balance(&f.c), 0);
}

#[test]
fn two_works_keep_state_and_balances_isolated() {
    let f = fixture();
    let c = HitoEscrowClient::new(&f.e, &f.c);
    let second = BytesN::from_array(&f.e, &[4; 32]);
    funded(&f);
    create_with(&f, &second, vec![&f.e, 100i128]);
    c.accept(&second, &f.h);
    c.fund(&second);

    let proof = evidence(&f);
    c.submit(&f.w, &0, &proof);
    c.approve(&f.w, &0, &proof);
    c.release(&f.w, &0, &proof);

    assert_eq!(c.get(&f.w).remaining, 60);
    assert_eq!(c.get(&second).remaining, 100);
    assert_eq!(token::Client::new(&f.e, &f.t).balance(&f.c), 160);
    assert_eq!(token::Client::new(&f.e, &f.t).balance(&f.q), 40);

    c.request_cancel(&second);
    c.cancel(&second);
    assert_eq!(c.get(&f.w).remaining, 60);
    assert_eq!(token::Client::new(&f.e, &f.t).balance(&f.c), 60);
    assert_eq!(token::Client::new(&f.e, &f.t).balance(&f.p), 900);
}

#[test]
fn cancel_request_freezes_delivery_until_payer_refunds() {
    let f = fixture();
    funded(&f);
    let c = HitoEscrowClient::new(&f.e, &f.c);
    c.request_cancel(&f.w);
    assert!(c.try_submit(&f.w, &0, &evidence(&f)).is_err());
    c.cancel(&f.w);
    assert!(c.get(&f.w).closed);
}

#[test]
fn unfunded_work_can_be_cancelled_by_payer() {
    let f = fixture();
    create(&f);
    let c = HitoEscrowClient::new(&f.e, &f.c);
    c.cancel(&f.w);
    let work = c.get(&f.w);
    assert!(work.closed);
    assert_eq!(work.remaining, 0);
}

#[test]
fn expiry_refunds_only_unpaid_balance() {
    let f = fixture();
    funded(&f);
    let c = HitoEscrowClient::new(&f.e, &f.c);
    let proof = evidence(&f);
    c.submit(&f.w, &0, &proof);
    c.approve(&f.w, &0, &proof);
    c.release(&f.w, &0, &proof);

    f.e.ledger().with_mut(|li| li.timestamp = 1001);
    c.refund_expired(&f.w);
    assert!(c.get(&f.w).closed);
    assert_eq!(token::Client::new(&f.e, &f.t).balance(&f.p), 960);
    assert_eq!(token::Client::new(&f.e, &f.t).balance(&f.q), 40);
    assert_eq!(token::Client::new(&f.e, &f.t).balance(&f.c), 0);
}

#[test]
fn touch_renews_work_ttl_near_threshold() {
    let f = fixture();
    create(&f);
    let key = Key::Work(f.w.clone());
    let initial =
        f.e.as_contract(&f.c, || f.e.storage().persistent().get_ttl(&key));
    assert_eq!(initial, 200_000);

    f.e.ledger().with_mut(|li| li.sequence_number += 196_001);
    let before =
        f.e.as_contract(&f.c, || f.e.storage().persistent().get_ttl(&key));
    assert!(before < 5_000);
    HitoEscrowClient::new(&f.e, &f.c).touch(&f.w);
    let renewed =
        f.e.as_contract(&f.c, || f.e.storage().persistent().get_ttl(&key));
    assert_eq!(renewed, 200_000);
}
