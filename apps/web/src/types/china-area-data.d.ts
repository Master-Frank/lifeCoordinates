declare module "china-area-data" {
  interface AreaData {
    [key: string]: {
      [key: string]: string;
    };
  }
  const chinaAreaData: AreaData;
  export default chinaAreaData;
}
