"use client";

import { useAccount } from "wagmi";
import { formatUnits, parseUnits } from "ethers";
import React, { useState, useEffect } from "react";
import { type GetBalanceReturnType } from "@wagmi/core";
import MoreToggle from "@/components/moreToggle/MoreToggle";
import MoreButton from "@/components/moreButton/MoreButton";
import InputTokenMax from "@/components/input/InputTokenMax";
import ListIconToken from "@/components/token/ListIconToken";
import { IBorrowPosition } from "@/types";
import { initBalance } from "@/utils/const";
import { errMessages } from "@/utils/errors";
import { getTokenBallance } from "@/utils/contract";
import {
  getTokenInfo,
  getPremiumLltv,
  formatTokenValue,
  notify,
  validInputAmount,
  isFlow,
} from "@/utils/utils";

interface Props extends IBorrowPosition {
  useFlow: boolean;
  setAmount: (amount: string) => void;
  setUseMax: (useMax: boolean) => void;
  setUseFlow: (useWflow: boolean) => void;
}

const VaultRepayInput: React.FC<Props> = ({
  item,
  useFlow,
  setUseMax,
  setAmount,
  closeModal,
  setUseFlow,
}) => {
  const { address: userAddress } = useAccount();

  const [repayAmount, setRepayAmount] = useState("");
  const [loanBalance, setLoanBalance] =
    useState<GetBalanceReturnType>(initBalance);
  const [wflowBalanceString, setWflowBalanceString] =
    useState<GetBalanceReturnType>(initBalance);

  const collateralToken = getTokenInfo(item.inputToken.id).symbol;
  const loanToken = getTokenInfo(item.borrowedToken.id);
  const lltv2: number | null = getPremiumLltv(item.marketParams);

  useEffect(() => {
    const initBalances = async () => {
      if (userAddress) {
        setLoanBalance(
          await getTokenBallance(item.borrowedToken.id, userAddress)
        );

        if (isFlow(item.borrowedToken.id)) {
          setWflowBalanceString(
            await getTokenBallance(item.borrowedToken.id, userAddress, false)
          );
        }
      }
    };

    initBalances();
  }, [item, userAddress]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRepayAmount(event.target.value);
    setUseMax(
      event.target.value.length > 0 &&
        parseUnits(event.target.value, loanToken.decimals) >= item.loan
        ? true
        : false
    );
  };

  const handleSetMax = (maxValue: string) => {
    const selBalance = useFlow ? loanBalance : wflowBalanceString;
    if (selBalance) {
      const maxAmount =
        selBalance.value >= item.loan ? item.loan : selBalance.value;

      setRepayAmount(formatUnits(maxAmount, loanToken.decimals));
      setUseMax(selBalance.value >= item.loan ? true : false);
    }
  };

  const handleRepay = () => {
    if (validInputAmount(repayAmount)) {
      if (Number(repayAmount) > Number(getRepayAmount())) {
        notify(errMessages.insufficient_amount);
      } else {
        setAmount(repayAmount);
      }
    } else {
      notify(errMessages.invalid_amount);
    }
  };

  const getRepayAmount = (): string => {
    return useFlow ? loanBalance.formatted : wflowBalanceString.formatted;
  };

  return (
    <div className="more-bg-secondary w-full modal-base relative">
      <div
        className="rounded-full bg-[#343434] hover:bg-[#3f3f3f] p-6 absolute right-4 top-4"
        onClick={closeModal}
      >
        <img
          src={"assets/icons/close.svg"}
          alt="close"
          className="w-[12px] h-[12px]"
        />
      </div>
      <div className="px-[28px] pt-[50px] pb-[30px] font-[16px]">
        <div className="text-[24px] mb-[40px] font-semibold">Repay Loan</div>
        <div className="flex items-center mb-[30px] font-semibold text-[20px] gap-2">
          <ListIconToken
            iconNames={[item.inputToken.id, item.borrowedToken.id]}
            className="w-[24px] h-[24px] "
          />
          <div className="ml-3  flex items-center'">
            {collateralToken} / {loanToken.symbol}
          </div>
        </div>
        <div className="w-full flex flex-col justify-center">
          <div className="text-[16px] mb-5">Repay {loanToken.symbol}</div>
          {isFlow(item.borrowedToken.id) && (
            <div className="text-l text-[16px] mb-5">
              Use FLOW <MoreToggle checked={useFlow} setChecked={setUseFlow} />
            </div>
          )}
          <InputTokenMax
            type="number"
            value={repayAmount}
            onChange={handleInputChange}
            placeholder="0"
            token={item.borrowedToken.id}
            balance={getRepayAmount()}
            setMax={handleSetMax}
          />
          <div className="text-right text-[16px] font-semibold more-text-gray px-4 mt-4">
            Balance: {getRepayAmount()} {useFlow ? loanToken.symbol : "WFLOW"}
          </div>
        </div>
        <div className="flex justify-end mt-[40px] ">
          <div className="mr-5">
            <MoreButton
              className="text-2xl py-2"
              text="Cancel"
              onClick={closeModal}
              color="grey"
            />
          </div>
          <MoreButton
            className="text-2xl py-2"
            text="Confirm"
            onClick={() => handleRepay()}
            color="primary"
          />
        </div>
      </div>
      <div className="w-[50%] mx-15 flex justify-center mx-auto">
        <div className="glowing-text-primary w-full" />
      </div>
      <div className="flex  flex-col items-center justify-start more-bg-primary rounded-b-[20px] px-[28px] pb-[40px] pt-[30px] text-[16px] font-normal">
        <div className="flex w-full justify-between mb-[20px]">
          <div>Borrow APY / Projected Borrow APY</div>
          <div>
            <span className="more-text-gray font-medium">
              {(item.borrow_apr * 100).toFixed(2)} %
            </span>
          </div>
        </div>
        <div className="flex w-full justify-between mb-[20px]">
          <div>LTV / Liquidation LTV</div>
          <div>
            <span className="more-text-gray font-medium">
              {(formatTokenValue(item.marketParams.lltv, "", 18) * 100).toFixed(
                2
              )}
              %{lltv2 ? " / " + lltv2.toFixed(2) + "%" : ""}
            </span>
          </div>
        </div>
        <div className="flex w-full justify-between mb-[20px]">
          <div>Collateral ({collateralToken})</div>
          <div>
            <span className="more-text-gray font-medium">
              {formatTokenValue(item.collateral, item.inputToken.id)}
            </span>
          </div>
        </div>
        <div className="flex w-full justify-between">
          <div>Loan ({loanToken.symbol})</div>
          <div>
            <span className="more-text-gray font-medium">
              {formatTokenValue(item.loan, item.borrowedToken.id).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaultRepayInput;
