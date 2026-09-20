#![no_std]
// `create` is the frozen public ABI: seven contract arguments plus `Env`.
// Grouping them now would break every prepared invocation and SDK adapter.
#![allow(clippy::too_many_arguments)]
use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, panic_with_error, token,
    Address, BytesN, Env, Vec,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    Missing = 1,
    Exists = 2,
    State = 3,
    Amount = 4,
    Deadline = 5,
    Index = 6,
    Evidence = 7,
    Dependencies = 8,
    Parties = 9,
}
#[contracttype]
#[derive(Clone)]
enum Key {
    Token,
    Work(BytesN<32>),
}
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Milestone {
    pub amount: i128,
    pub dependencies: u32,
    pub evidence: BytesN<32>,
    pub has_evidence: bool,
    pub approved: bool,
    pub paid: bool,
}
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Work {
    pub payer: Address,
    pub payee: Address,
    pub plan_hash: BytesN<32>,
    pub deadline: u64,
    pub total: i128,
    pub remaining: i128,
    pub accepted: bool,
    pub funded: bool,
    pub closed: bool,
    pub cancel_requested: bool,
    pub milestones: Vec<Milestone>,
}

// These typed events retain the v0.1 wire representation: the fixed event
// name and identifiers are topics, while the final field is a single value.
#[contractevent(topics = ["created"], data_format = "single-value")]
pub struct Created {
    #[topic]
    pub wid: BytesN<32>,
    pub plan_hash: BytesN<32>,
}

#[contractevent(topics = ["accepted"], data_format = "single-value")]
pub struct Accepted {
    #[topic]
    pub wid: BytesN<32>,
    pub plan_hash: BytesN<32>,
}

#[contractevent(topics = ["funded"], data_format = "single-value")]
pub struct Funded {
    #[topic]
    pub wid: BytesN<32>,
    pub amount: i128,
}

#[contractevent(topics = ["submitted"], data_format = "single-value")]
pub struct Submitted {
    #[topic]
    pub wid: BytesN<32>,
    #[topic]
    pub index: u32,
    pub evidence: BytesN<32>,
}

#[contractevent(topics = ["approved"], data_format = "single-value")]
pub struct Approved {
    #[topic]
    pub wid: BytesN<32>,
    #[topic]
    pub index: u32,
    pub evidence: BytesN<32>,
}

#[contractevent(topics = ["paid"], data_format = "single-value")]
pub struct Paid {
    #[topic]
    pub wid: BytesN<32>,
    #[topic]
    pub index: u32,
    pub amount: i128,
}

#[contractevent(topics = ["cancelreq"], data_format = "single-value")]
pub struct CancelRequested {
    #[topic]
    pub wid: BytesN<32>,
    pub amount: i128,
}

#[contractevent(topics = ["cancelled"], data_format = "single-value")]
pub struct Cancelled {
    #[topic]
    pub wid: BytesN<32>,
    pub amount: i128,
}

#[contractevent(topics = ["refunded"], data_format = "single-value")]
pub struct Refunded {
    #[topic]
    pub wid: BytesN<32>,
    pub amount: i128,
}
#[contract]
pub struct HitoEscrow;
fn fail(e: &Env, condition: bool, error: Error) {
    if !condition {
        panic_with_error!(e, error);
    }
}
fn load(e: &Env, wid: &BytesN<32>) -> Work {
    e.storage()
        .persistent()
        .get(&Key::Work(wid.clone()))
        .unwrap_or_else(|| panic_with_error!(e, Error::Missing))
}
fn store(e: &Env, wid: &BytesN<32>, work: &Work) {
    let key = Key::Work(wid.clone());
    e.storage().persistent().set(&key, work);
    e.storage().persistent().extend_ttl(&key, 5000, 200000);
    e.storage().instance().extend_ttl(5000, 200000);
}
fn asset(e: &Env) -> Address {
    e.storage()
        .instance()
        .get(&Key::Token)
        .unwrap_or_else(|| panic_with_error!(e, Error::Missing))
}
fn get_m(e: &Env, w: &Work, i: u32) -> Milestone {
    w.milestones
        .get(i)
        .unwrap_or_else(|| panic_with_error!(e, Error::Index))
}
fn live(e: &Env, w: &Work) {
    fail(
        e,
        w.funded && !w.closed && !w.cancel_requested,
        Error::State,
    );
}
fn no_approved_unpaid(e: &Env, w: &Work) {
    for m in w.milestones.iter() {
        fail(e, !m.approved || m.paid, Error::State);
    }
}

#[contractimpl]
impl HitoEscrow {
    /// One immutable asset per deployment. No admin upgrade/sweep function.
    pub fn __constructor(e: Env, token: Address) {
        e.storage().instance().set(&Key::Token, &token);
    }
    pub fn asset(e: Env) -> Address {
        asset(&e)
    }
    pub fn get(e: Env, wid: BytesN<32>) -> Work {
        load(&e, &wid)
    }
    pub fn touch(e: Env, wid: BytesN<32>) {
        let w = load(&e, &wid);
        store(&e, &wid, &w);
    }
    pub fn create(
        e: Env,
        wid: BytesN<32>,
        payer: Address,
        payee: Address,
        plan_hash: BytesN<32>,
        amounts: Vec<i128>,
        dependencies: Vec<u32>,
        deadline: u64,
    ) {
        payer.require_auth();
        fail(
            &e,
            !e.storage().persistent().has(&Key::Work(wid.clone())),
            Error::Exists,
        );
        fail(&e, payer != payee, Error::Parties);
        fail(
            &e,
            deadline > e.ledger().timestamp()
                && deadline <= e.ledger().timestamp().saturating_add(366 * 86400),
            Error::Deadline,
        );
        fail(
            &e,
            !amounts.is_empty() && amounts.len() <= 10 && dependencies.len() == amounts.len(),
            Error::Amount,
        );
        fail(
            &e,
            plan_hash != BytesN::from_array(&e, &[0u8; 32]),
            Error::Evidence,
        );
        let mut total = 0i128;
        let mut ms = Vec::new(&e);
        for i in 0..amounts.len() {
            let amount = amounts.get(i).unwrap();
            fail(&e, amount > 0, Error::Amount);
            total = total
                .checked_add(amount)
                .unwrap_or_else(|| panic_with_error!(&e, Error::Amount));
            let mask = dependencies.get(i).unwrap();
            fail(&e, mask < (1u32 << i), Error::Dependencies);
            ms.push_back(Milestone {
                amount,
                dependencies: mask,
                evidence: BytesN::from_array(&e, &[0u8; 32]),
                has_evidence: false,
                approved: false,
                paid: false,
            });
        }
        let w = Work {
            payer,
            payee,
            plan_hash,
            deadline,
            total,
            remaining: 0,
            accepted: false,
            funded: false,
            closed: false,
            cancel_requested: false,
            milestones: ms,
        };
        store(&e, &wid, &w);
        Created {
            wid,
            plan_hash: w.plan_hash,
        }
        .publish(&e);
    }
    pub fn accept(e: Env, wid: BytesN<32>, expected_plan: BytesN<32>) {
        let mut w = load(&e, &wid);
        w.payee.require_auth();
        fail(&e, !w.closed && !w.accepted && !w.funded, Error::State);
        fail(&e, w.deadline > e.ledger().timestamp(), Error::Deadline);
        fail(&e, w.plan_hash == expected_plan, Error::Evidence);
        w.accepted = true;
        store(&e, &wid, &w);
        Accepted {
            wid,
            plan_hash: expected_plan,
        }
        .publish(&e);
    }
    pub fn fund(e: Env, wid: BytesN<32>) {
        let mut w = load(&e, &wid);
        w.payer.require_auth();
        fail(&e, w.accepted && !w.funded && !w.closed, Error::State);
        fail(&e, w.deadline > e.ledger().timestamp(), Error::Deadline);
        // Set state before external call; any failed transfer rolls the whole invocation back.
        w.funded = true;
        w.remaining = w.total;
        store(&e, &wid, &w);
        token::Client::new(&e, &asset(&e)).transfer(
            &w.payer,
            e.current_contract_address(),
            &w.total,
        );
        Funded {
            wid,
            amount: w.total,
        }
        .publish(&e);
    }
    pub fn submit(e: Env, wid: BytesN<32>, index: u32, evidence: BytesN<32>) {
        let mut w = load(&e, &wid);
        w.payee.require_auth();
        live(&e, &w);
        fail(&e, w.deadline >= e.ledger().timestamp(), Error::Deadline);
        let mut m = get_m(&e, &w, index);
        fail(&e, !m.approved && !m.paid, Error::State);
        fail(
            &e,
            evidence != BytesN::from_array(&e, &[0u8; 32]),
            Error::Evidence,
        );
        m.evidence = evidence.clone();
        m.has_evidence = true;
        w.milestones.set(index, m);
        store(&e, &wid, &w);
        Submitted {
            wid,
            index,
            evidence,
        }
        .publish(&e);
    }
    pub fn approve(e: Env, wid: BytesN<32>, index: u32, expected_evidence: BytesN<32>) {
        let mut w = load(&e, &wid);
        w.payer.require_auth();
        live(&e, &w);
        let mut m = get_m(&e, &w, index);
        fail(
            &e,
            m.has_evidence && m.evidence == expected_evidence,
            Error::Evidence,
        );
        fail(&e, !m.approved && !m.paid, Error::State);
        for j in 0..index {
            if (m.dependencies & (1u32 << j)) != 0 {
                fail(&e, w.milestones.get(j).unwrap().paid, Error::Dependencies);
            }
        }
        m.approved = true;
        w.milestones.set(index, m);
        store(&e, &wid, &w);
        Approved {
            wid,
            index,
            evidence: expected_evidence,
        }
        .publish(&e);
    }
    /// Permissionless execution AFTER payer approval. Destination/amount cannot be supplied by caller.
    pub fn release(e: Env, wid: BytesN<32>, index: u32, expected_evidence: BytesN<32>) {
        let mut w = load(&e, &wid);
        live(&e, &w);
        let mut m = get_m(&e, &w, index);
        fail(&e, m.approved && !m.paid, Error::State);
        fail(&e, m.evidence == expected_evidence, Error::Evidence);
        w.remaining = w
            .remaining
            .checked_sub(m.amount)
            .unwrap_or_else(|| panic_with_error!(&e, Error::Amount));
        fail(&e, w.remaining >= 0, Error::Amount);
        m.paid = true;
        w.milestones.set(index, m.clone());
        if w.remaining == 0 {
            w.closed = true;
        }
        store(&e, &wid, &w);
        token::Client::new(&e, &asset(&e)).transfer(
            &e.current_contract_address(),
            &w.payee,
            &m.amount,
        );
        Paid {
            wid,
            index,
            amount: m.amount,
        }
        .publish(&e);
    }
    /// Payee agrees to return ALL remaining unapproved funds. Payer completes cancellation.
    pub fn request_cancel(e: Env, wid: BytesN<32>) {
        let mut w = load(&e, &wid);
        w.payee.require_auth();
        live(&e, &w);
        no_approved_unpaid(&e, &w);
        w.cancel_requested = true;
        store(&e, &wid, &w);
        CancelRequested {
            wid,
            amount: w.remaining,
        }
        .publish(&e);
    }
    pub fn cancel(e: Env, wid: BytesN<32>) {
        let mut w = load(&e, &wid);
        w.payer.require_auth();
        fail(&e, !w.closed, Error::State);
        if w.funded {
            fail(&e, w.cancel_requested, Error::State);
            no_approved_unpaid(&e, &w);
        }
        let refund = w.remaining;
        w.remaining = 0;
        w.closed = true;
        store(&e, &wid, &w);
        if refund > 0 {
            token::Client::new(&e, &asset(&e)).transfer(
                &e.current_contract_address(),
                &w.payer,
                &refund,
            );
        }
        Cancelled {
            wid,
            amount: refund,
        }
        .publish(&e);
    }
    /// No unilateral refund of a submitted but unresolved milestone, even after the deadline.
    pub fn refund_expired(e: Env, wid: BytesN<32>) {
        let mut w = load(&e, &wid);
        w.payer.require_auth();
        fail(&e, w.funded && !w.closed, Error::State);
        fail(&e, e.ledger().timestamp() > w.deadline, Error::Deadline);
        for m in w.milestones.iter() {
            fail(&e, m.paid || !m.has_evidence, Error::State);
        }
        let refund = w.remaining;
        w.remaining = 0;
        w.closed = true;
        store(&e, &wid, &w);
        if refund > 0 {
            token::Client::new(&e, &asset(&e)).transfer(
                &e.current_contract_address(),
                &w.payer,
                &refund,
            );
        }
        Refunded {
            wid,
            amount: refund,
        }
        .publish(&e);
    }
}
#[cfg(test)]
mod test;
