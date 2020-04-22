export type ConfigType = string | boolean | number | Date;
export interface ConfigFile {
  [key: string]: ConfigType;
}
