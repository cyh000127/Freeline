export interface EventBoothItem {
  boothId: number;
  name: string;
  locationCode: string;
  isEmergencyClosed: boolean;
  openTime: string;
  closeTime: string;
}

export interface BoothGoodsItem {
  goodsId: number;
  name: string;
  imageUrl: string;
  isSoldOut: boolean;
}

export interface BoothDetailData {
  boothId: number;
  name: string;
  locationCode: string;
  isEmergencyClosed: boolean;
  waitingCount: number;
  callCount: number;
  callValidSeconds: number;
  goods: BoothGoodsItem[];
}
