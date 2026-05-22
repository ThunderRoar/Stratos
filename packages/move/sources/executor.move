module stratos::executor;

use sui::clock::Clock;
use sui::event;
use deepbook_predict::predict::{Self, Predict};
use deepbook_predict::predict_manager::PredictManager;
use deepbook_predict::oracle::OracleSVI;
use deepbook_predict::market_key::{Self, MarketKey};

const EInvalidBullLadder: u64 = 1;
const EInvalidBearLadder: u64 = 2;
const EInvalidStrangle: u64 = 3;
const EInvalidRangeBet: u64 = 4;

public struct StrategyExecuted has copy, drop {
    strategy_type: vector<u8>,
    manager: ID,
    oracle: ID,
    leg_count: u64,
    timestamp_ms: u64,
}

/// Bull Ladder: BUY UP at K1 + BUY UP at K2 where K1 < K2.
/// Step-function payoff that climbs as price rises through each strike.
public fun execute_bull_ladder<Quote>(
    predict: &mut Predict,
    manager: &mut PredictManager,
    oracle: &OracleSVI,
    expiry: u64,
    strike1: u64,
    strike2: u64,
    qty: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(strike1 < strike2, EInvalidBullLadder);
    let oracle_id = object::id(oracle);

    let key1 = market_key::up(oracle_id, expiry, strike1);
    predict::mint<Quote>(predict, manager, oracle, key1, qty, clock, ctx);

    let key2 = market_key::up(oracle_id, expiry, strike2);
    predict::mint<Quote>(predict, manager, oracle, key2, qty, clock, ctx);

    event::emit(StrategyExecuted {
        strategy_type: b"bull_ladder",
        manager: object::id(manager),
        oracle: oracle_id,
        leg_count: 2,
        timestamp_ms: sui::clock::timestamp_ms(clock),
    });
}

public fun execute_bear_ladder<Quote>(
    predict: &mut Predict,
    manager: &mut PredictManager,
    oracle: &OracleSVI,
    expiry: u64,
    strike1: u64,
    strike2: u64,
    qty: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(strike1 > strike2, EInvalidBearLadder);
    let oracle_id = object::id(oracle);

    let key1 = market_key::down(oracle_id, expiry, strike1);
    predict::mint<Quote>(predict, manager, oracle, key1, qty, clock, ctx);

    let key2 = market_key::down(oracle_id, expiry, strike2);
    predict::mint<Quote>(predict, manager, oracle, key2, qty, clock, ctx);

    event::emit(StrategyExecuted {
        strategy_type: b"bear_ladder",
        manager: object::id(manager),
        oracle: oracle_id,
        leg_count: 2,
        timestamp_ms: sui::clock::timestamp_ms(clock),
    });
}

public fun execute_strangle<Quote>(
    predict: &mut Predict,
    manager: &mut PredictManager,
    oracle: &OracleSVI,
    expiry: u64,
    strike_up: u64,
    strike_down: u64,
    qty: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(strike_down < strike_up, EInvalidStrangle);
    let oracle_id = object::id(oracle);

    let key1 = market_key::up(oracle_id, expiry, strike_up);
    predict::mint<Quote>(predict, manager, oracle, key1, qty, clock, ctx);

    let key2 = market_key::down(oracle_id, expiry, strike_down);
    predict::mint<Quote>(predict, manager, oracle, key2, qty, clock, ctx);

    event::emit(StrategyExecuted {
        strategy_type: b"strangle",
        manager: object::id(manager),
        oracle: oracle_id,
        leg_count: 2,
        timestamp_ms: sui::clock::timestamp_ms(clock),
    });
}

public fun execute_range_bet<Quote>(
    predict: &mut Predict,
    manager: &mut PredictManager,
    oracle: &OracleSVI,
    expiry: u64,
    strike_low: u64,
    strike_high: u64,
    qty: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(strike_low < strike_high, EInvalidRangeBet);
    let oracle_id = object::id(oracle);

    let key1 = market_key::up(oracle_id, expiry, strike_low);
    predict::mint<Quote>(predict, manager, oracle, key1, qty, clock, ctx);

    let key2 = market_key::down(oracle_id, expiry, strike_high);
    predict::mint<Quote>(predict, manager, oracle, key2, qty, clock, ctx);

    event::emit(StrategyExecuted {
        strategy_type: b"range_bet",
        manager: object::id(manager),
        oracle: oracle_id,
        leg_count: 2,
        timestamp_ms: sui::clock::timestamp_ms(clock),
    });
}
