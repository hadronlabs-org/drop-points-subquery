import { CosmosMessage, CosmosTransaction } from "@subql/types-cosmos";
import { UserBalance } from "../types";
import { config } from "../config";

type BondExecuteMessageType = {
    bond: {
      ref?: string
    };
};

const amountToSumAndDenom = (amount:string) => {
  const [,sum,denom,] = amount.split(/^(\d+)(.+)$/);
  return {sum, denom};
}

export async function handleCoinSecret(
  tx: CosmosTransaction
): Promise<void> {
  const networkConfig = config[tx.block.header.chainId as (keyof typeof config)];
  for(const event of tx.tx.events) {
    if (event.type === 'coinbase') {
      const amount = event.attributes.find(a => a.key === 'YW1vdW50')?.value;
      const recipientB64 =  event.attributes.find(a => a.key === 'bWludGVy')?.value;
      if (!amount || !recipientB64) continue;
      const recipient = Buffer.from(recipientB64, 'base64').toString();
      const {sum:sumStr, denom} = amountToSumAndDenom(Buffer.from(amount,'base64').toString());
      if (!networkConfig.denoms.includes(denom)) continue;
      const sum = BigInt(sumStr);
      const current = (await UserBalance.get(recipient))?.balance || BigInt(0);
      await UserBalance.create({
        lastHeight: BigInt(tx.block.header.height),
        balance: current + sum,
        id: recipient,
        chainId: tx.block.header.chainId,
        denom,
        lastDate: new Date(tx.block.header.time.toDateString())
      }).save();
    }
    if (event.type === 'transfer' ) {
      const amount = event.attributes.find(a => a.key === 'YW1vdW50')?.value;
      const recipientB64 = event.attributes.find(a => a.key === 'cmVjaXBpZW50')?.value;
      const senderB64 = event.attributes.find(a => a.key === 'c2VuZGVy')?.value;
      if (!amount || !recipientB64 || !senderB64) continue;
      const recipient = Buffer.from(recipientB64, 'base64').toString();
      const sender = Buffer.from(senderB64, 'base64').toString();
      const {sum:sumStr, denom} = amountToSumAndDenom(Buffer.from(amount, 'base64').toString());
      if (!networkConfig.denoms.includes(denom)) continue;
      const sum = BigInt(sumStr);
      {
        const current = (await UserBalance.get(recipient))?.balance || BigInt(0);
        await UserBalance.create({
          lastHeight: BigInt(tx.block.header.height),
          balance: current + sum,
          chainId: tx.block.header.chainId,
          id: recipient,
          denom,
          lastDate: new Date(tx.block.header.time.toDateString())
        }).save();
      }
      {
        const current = (await UserBalance.get(recipient))?.balance || BigInt(0);
        await UserBalance.create({
          lastHeight: BigInt(tx.block.header.height),
          balance: current - sum,
          denom,
          id: sender,
          chainId: tx.block.header.chainId,
          lastDate: new Date(tx.block.header.time.toDateString())
        }).save();
      }
    }    
  }
}


export async function handleCoin(
  tx: CosmosTransaction
): Promise<void> {
  const networkConfig = config[tx.block.header.chainId as (keyof typeof config)];
  for(const event of tx.tx.events) {
    if (event.type === 'coinbase') {
      const amount = event.attributes.find(a => a.key === 'amount')?.value;
      const recipient =  event.attributes.find(a => a.key === 'minter')?.value;
      if (!amount || !recipient) continue;
      const {sum:sumStr, denom} = amountToSumAndDenom(amount);
      if (!networkConfig.denoms.includes(denom)) continue;
      const sum = BigInt(sumStr);
      const current = (await UserBalance.get(recipient))?.balance || BigInt(0);
      await UserBalance.create({
        lastHeight: BigInt(tx.block.header.height),
        balance: current + sum,
        id: recipient,
        chainId: tx.block.header.chainId,
        denom,
        lastDate: new Date(tx.block.header.time.toDateString())
      }).save();
    }
    if (event.type === 'transfer' ) {
      const amount = event.attributes.find(a => a.key === 'amount')?.value;
      const recipient = event.attributes.find(a => a.key === 'recipient')?.value;
      const sender = event.attributes.find(a => a.key === 'sender')?.value;
      if (!amount || !recipient || !sender) continue;
      const {sum:sumStr, denom} = amountToSumAndDenom(amount);
      if (!networkConfig.denoms.includes(denom)) continue;
      const sum = BigInt(sumStr);
      {
        const current = (await UserBalance.get(recipient))?.balance || BigInt(0);
        await UserBalance.create({
          lastHeight: BigInt(tx.block.header.height),
          balance: current + sum,
          chainId: tx.block.header.chainId,
          id: recipient,
          denom,
          lastDate: new Date(tx.block.header.time.toDateString())
        }).save();
      }
      {
        const current = (await UserBalance.get(recipient))?.balance || BigInt(0);
        await UserBalance.create({
          lastHeight: BigInt(tx.block.header.height),
          balance: current - sum,
          denom,
          id: sender,
          chainId: tx.block.header.chainId,
          lastDate: new Date(tx.block.header.time.toDateString())
        }).save();
      }
    }    
  }
}
