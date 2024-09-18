"use client";

import _ from "lodash";
import React, { useState } from "react";
import MoreButton from "../../moreButton/MoreButton";
import { tokens } from "@/utils/const";

interface Props {
  wallet: string;
  closeModal: () => void;
}

interface ITokenItem {
  address: string;
  symbol: string;
}

const GetFaucet: React.FC<Props> = ({ wallet, closeModal }) => {
  const [completed, setCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const initFaucet = async () => {
    if (wallet) {
      setCompleted(false);
      setIsLoading(true);
      try {
        const res = await fetch("/api/faucet", {
          method: "POST",
          body: JSON.stringify({ wallet }),
          headers: {
            "content-type": "application/json",
          },
        });

        if (res.ok) {
          // console.log("Yeai!");
        } else {
          // console.log("Oops! Something is wrong.");
        }

        setCompleted(true);
        setIsLoading(false);
      } catch (err) {
        console.log(err);
      }
    }
  };

  let tokenList: ITokenItem[] = [];
  _.forOwn(tokens, (value, token) => {
    tokenList.push({
      address: token,
      symbol: value.symbol,
    });
  });

  return (
    <div className="more-bg-secondary w-full rounded-[20px]">
      <div className="text-4xl mb-10 px-4 pt-10">Get Free Testnet Tokens</div>
      <div className="text-xl mb-5 px-4">
        <p className="mb-5 text-xl">
          When you click the Request button, the protocol will transfer you the
          following tokens:
        </p>
        <p className="mb-1 text-xl">* 1 FLOW</p>
        {tokenList.map((tokenItem) => (
          <p className="mb-1 text-xl" key={tokenItem.address}>
            * 1000 {tokenItem.symbol}
          </p>
        ))}
        <p className="mt-5 mb-5 text-xl">
          When you access vaults and markets you will see these tokens in your
          available balance, but they will not show in MetaMask by default.
        </p>
        <p />
        <p className="mb-5 text-xl">
          To add these tokens to MetaMask, in MetaMask, you can click on click
          Import tokens and add the following token contract addresses:
        </p>
        <p />
        {tokenList.map((tokenItem) => (
          <p className="mb-1" key={tokenItem.address}>
            For {tokenItem.symbol}, {tokenItem.address}
          </p>
        ))}
      </div>
      <div className="more-bg-primary px-4  py-2 rounded-b-[20px]">
        <div className="flex justify-end mr-5">
          {completed ? (
            <MoreButton
              className="text-2xl py-2"
              text="Done"
              onClick={closeModal}
              color="primary"
            />
          ) : (
            <MoreButton
              className="text-2xl py-2"
              text="Request"
              onClick={initFaucet}
              color="primary"
              disabled={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default GetFaucet;
