/**
 * Wallet utility functions for ZEST TOURNAMENT
 * Manages separation of Deposit Balance (used for match entry)
 * and Winning Balance (eligible for withdrawal).
 */

export const getUserBalances = (userData) => {
  if (!userData) {
    return { totalBalance: 0, depositBalance: 0, winningBalance: 0 };
  }

  const rawTotal = typeof userData.wallet === 'number'
    ? userData.wallet
    : (parseFloat(userData.wallet) || 0);

  let winning = 0;
  if (userData.winningBalance !== undefined && userData.winningBalance !== null && !isNaN(userData.winningBalance)) {
    winning = typeof userData.winningBalance === 'number'
      ? userData.winningBalance
      : (parseFloat(userData.winningBalance) || 0);
  }

  let deposit = 0;
  if (userData.depositBalance !== undefined && userData.depositBalance !== null && !isNaN(userData.depositBalance)) {
    deposit = typeof userData.depositBalance === 'number'
      ? userData.depositBalance
      : (parseFloat(userData.depositBalance) || 0);
  } else {
    // If depositBalance is not explicitly set yet, calculate from rawTotal - winning
    deposit = Math.max(0, rawTotal - winning);
  }

  winning = Math.max(0, Number(winning.toFixed(2)));
  deposit = Math.max(0, Number(deposit.toFixed(2)));
  const total = Number((deposit + winning).toFixed(2));

  return {
    totalBalance: total,
    depositBalance: deposit,
    winningBalance: winning
  };
};

/**
 * Calculates fee deduction split for joining a match:
 * Deposit balance is deducted first, then remainder from winning balance.
 */
export const calculateMatchEntrySplit = (currentDeposit, currentWinning, fee) => {
  const numFee = Number(fee) || 0;
  const dep = Number(currentDeposit) || 0;
  const win = Number(currentWinning) || 0;
  const total = dep + win;

  if (total < numFee) {
    return {
      canAfford: false,
      deductFromDeposit: 0,
      deductFromWinning: 0,
      newDeposit: dep,
      newWinning: win,
      newTotal: total
    };
  }

  const deductFromDeposit = Math.min(dep, numFee);
  const remainder = numFee - deductFromDeposit;
  const deductFromWinning = Math.min(win, remainder);

  const newDeposit = Math.max(0, Number((dep - deductFromDeposit).toFixed(2)));
  const newWinning = Math.max(0, Number((win - deductFromWinning).toFixed(2)));
  const newTotal = Number((newDeposit + newWinning).toFixed(2));

  return {
    canAfford: true,
    deductFromDeposit,
    deductFromWinning,
    newDeposit,
    newWinning,
    newTotal
  };
};
