import { useAccount } from "wagmi";
import ButtonDialog from "../buttonDialog/buttonDialog";
import VaultDetail from "../modal/VaultDetail";
import VaultDeposit from "../modal/deposit/VaultDeposit";
import IconToken from "../token/IconToken";
import { InvestmentData } from "@/types";

interface Props {
  vault: InvestmentData;
}

const HeaderEarnDetail: React.FC<Props> = ({ vault }) => {
  const { address: userAddress } = useAccount();

  return (
    <div className="flex flex-col sm:flex-row gap-8 w-full items-center justify-between my-4">
      <div className="flex items-center gap-10">
        <div className="flex gap-2 items-center text-[25px] items-start">
          <IconToken tokenName="usdc" className="w-10 h-10" />
          <div>{vault.vaultName}</div>
        </div>
        <div className="flex gap-2 items-center text-[14px] pt-2 leading-normal">
          <IconToken tokenName={vault.tokenSymbol} className="w-6 h-6 " />
          <div>{vault.tokenSymbol.toUpperCase()}</div>
        </div>
        <div className="flex gap-2 items-center text-[14px] pt-2 leading-normal">
          <IconToken tokenName={vault.tokenSymbol} className="w-6 h-6 " />
          <div>
            {vault.curator && vault.curator.length > 0 ? vault.curator : "-"}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        {userAddress && (
          <ButtonDialog color="primary" buttonText="Deposit">
            {(closeModal) => (
              <div className="h-full w-full">
                <VaultDeposit item={vault} closeModal={closeModal} />
              </div>
            )}
          </ButtonDialog>
        )}

        <ButtonDialog color="grey" buttonText="Vault Details">
          {(closeModal) => (
            <div className="h-full w-full">
              <VaultDetail item={vault} />
            </div>
          )}
        </ButtonDialog>
      </div>
    </div>
  );
};

export default HeaderEarnDetail;
