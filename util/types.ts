import { BigNumber } from "bignumber.js";

// Make sure to keep this in sync with the Multihash smart contract
export enum SignAlgorithm {
  Ethereum = 0,   // Sign with web3.eth_sign
                  // Should be compatible with Trezor now (with latest firmware):
                  // https://github.com/ethereum/go-ethereum/issues/14794#issuecomment-392028942
  EIP712 = 1,     // Sign with web3.eth.signTypedData
                  // EIP712: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md
  None = 255,     // Do not sign
}

export interface OrderInfo {
  // required fields in contract
  owner?: string;
  tokenS: string;
  tokenB: string;
  amountS: number;
  amountB: number;
  validSince?: number;

  // optional fields
  dualAuthAddr?: string;            // spec value 1
  broker?: string;                  // spec value 1 << 1
  orderInterceptor?: string;        // spec value 1 << 2
  walletAddr?: string;              // spec value 1 << 3
  validUntil?: number;              // spec value 1 << 4
  allOrNone?: boolean;              // spec value 1 << 5
  sig?: string;                     // spec value 1 << 6
  dualAuthSig?: string;             // spec value 1 << 7
  feeToken?: string;                // spec value 1 << 8
  feeAmount?: number;               // spec value 1 << 9
  feePercentage?: number;           // spec value 1 << 10
  waiveFeePercentage?: number;      // spec value 1 << 11
  tokenSFeePercentage?: number;     // spec value 1 << 12
  tokenBFeePercentage?: number;     // spec value 1 << 13

  // helper field
  maxAmountS?: number;
  maxAmountB?: number;
  fillAmountS?: number;
  fillAmountB?: number;
  fillAmountFee?: number;
  splitS?: number;
  brokerInterceptor?: string;
  valid?: boolean;

  hash?: Buffer;
  signAlgorithm?: SignAlgorithm;
  dualAuthSignAlgorithm?: SignAlgorithm;

  index?: number;

  [key: string]: any;
}

export interface Participation {
  order: OrderInfo;
  splitS?: number;
  feeAmount?: number;
  fillAmountS?: number;
  fillAmountB?: number;
}

export interface RingsSubmitParam {
  miningSpec: number;
  orderSpecs: number[];
  ringSpecs: number[][];
  addressList: string[];
  uintList: BigNumber[];
  uint16List: number[];
  bytesList: string[];
}

export interface RingsInfo {
  description?: string;
  feeRecipient?: string; // spec value: 1
  miner?: string;        // spec value: 1 << 1
  sig?: string;          // spec value: 1 << 2
  rings: number[][];
  orders: OrderInfo[];

  signAlgorithm?: SignAlgorithm;
  hash?: Buffer;
  transactionOrigin?: string;

  [key: string]: any;
}

export interface SimulatorReport {
  ringMinedEvents: RingMinedEvent[];
  transferItems: TransferItem[];
}

export interface TransferItem {
  token: string;
  from: string;
  to: string;
  amount: number;
}

export interface RingMinedEvent {
  ringIndex: BigNumber;
}
