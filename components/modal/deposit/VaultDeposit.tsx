"use client";

import React, { useState } from "react";
import VaultDepositInput from "./VaultDepositInput";
import VaultDepositPush from "./VaultDepositPush";
import VaultDepositResult from "./VaultDepositResult";
import { IInvestmentProp } from "@/types";

interface Props extends IInvestmentProp {
  closeModal: () => void;
}

const VaultDeposit: React.FC<Props> = ({ item, closeModal, updateInfo }) => {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState(0);
  const [txHash, setTxHash] = useState("");

  const handleSetDeposit = (amount: number) => {
    setAmount(amount);
    setStep(2);
  };

  const handleValidDeposit = () => {
    setStep(3);
  };

  const handleProcessDone = () => {
    closeModal();
    updateInfo(item.vaultId);
  };

  return (
    <>
      {step == 1 ? (
        <VaultDepositInput
          item={item}
          closeModal={closeModal}
          setAmount={handleSetDeposit}
        />
      ) : step == 2 ? (
        <VaultDepositPush
          item={item}
          amount={amount}
          closeModal={closeModal}
          setTxHash={setTxHash}
          validDeposit={handleValidDeposit}
        />
      ) : step == 3 ? (
        <VaultDepositResult
          item={item}
          amount={amount}
          txhash={txHash}
          processDone={handleProcessDone}
          closeModal={closeModal}
        />
      ) : null}
    </>
  );
};

export default VaultDeposit;
