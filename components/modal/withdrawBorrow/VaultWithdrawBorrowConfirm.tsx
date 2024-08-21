"use client";
import React, { useState } from 'react';
import InputTokenMax from '../../input/InputTokenMax';
import TotalVolumeToken from '../../token/TotalVolumeToken';
import MoreButton from '../../moreButton/MoreButton';
import Icon from '../../FontAwesomeIcon';
import TokenAmount from '@/components/token/TokenAmount';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface Props {
  title: string;
  token: string;
  balance: number;
  apy: number;
  ltv: string;
  amount: number;
  totalWithdraw: number;
  totalTokenAmount: number;
  processDone: () => void;
  closeModal: () => void;
}

const VaultWithdrawConfirm: React.FC<Props> = ({ title, token, balance, apy, ltv, totalWithdraw, totalTokenAmount, processDone, closeModal, amount }) => {

  
  return (
    <div className='more-bg-secondary h-full rounded-[12px]'>      
        <div className="text-2xl mb-10 px-8 pt-14 ">Transaction Confirmation</div>
        <div className="flex items-center text-xl mb-5 px-8"><span><CheckCircleIcon  className="text-secondary text-xl cursor-pointer w-8 h-8 mr-5" /></span>Approve the bundler to spend 0.19 USDmax (via permit) </div>
        <div className="flex items-center text-xl mb-5 px-8"><span><CheckCircleIcon  className="text-secondary text-xl cursor-pointer w-8 h-8 mr-5" /></span>Bundle the following action </div>


        <div className='more-bg-primary text-ll rounded-[5px] mb-5 py-8 px-8 mx-5 '> 
            Withdraw 0.50 USDC from USDmax
        </div>        
        
        <div className="flex items-center text-xl mb-5 px-8"><span><CheckCircleIcon  className="text-secondary text-xl cursor-pointer w-8 h-8 mr-5" /></span>Transaction 0x7854...854xs has been succefully executed</div>
        <div className="flex justify-end py-5 pb-4  rounded-b-[20px] ">
          <div className='mr-5'><MoreButton className='text-2xl  py-4' text="Done" onClick={closeModal} color="secondary" /></div>
        </div>              
    </div>
  );
};

export default VaultWithdrawConfirm;
