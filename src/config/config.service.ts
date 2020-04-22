import * as fs from 'fs-extra';
import { join } from 'path';
import { ConfigString } from './config.string';
import { ConfigType, ConfigFile } from './interface/config.interface';

export class ConfigService {
  private fileExt = '.json';

  constructor(private cwd: string) {}

  /**
   *  creates a new configuration file
   *  @throws {Error} if configuration file already exists
   *  @param {string} configName the name of configuration (without extension)
   *  @param {any} data the initial object data (default {})
   *  @return {string} returns the new file path (if created)
   */
  async create(configName: string, data: any = {}): Promise<string> {
    const path = this.getConfigPath(configName);

    if (await this.exists(configName)) {
      throw new Error(ConfigString.AlreadyExist);
    }

    await fs.writeJson(path, data);
    return path;
  }

  /**
   *  checks if a configuration file exists
   *  @param {string} configName
   *  @return {boolean} returns true if exists
   */
  async exists(configName: string): Promise<boolean> {
    return fs.pathExists(this.getConfigPath(configName));
  }

  /**
   *  deletes the configuration, or throws error if not exist
   *  @param {string} configName the configuration name
   *  @return {boolean} returns true if deleted
   */
  async delete(configName: string): Promise<boolean> {
    if (!(await this.exists(configName))) {
      throw new Error(ConfigString.NotFound);
    }

    await fs.remove(this.getConfigPath(configName));
    return true;
  }

  /**
   *  return all/a item from configuration
   *  @param {string} configName the config file to pull from
   *  @param {string} key (optional) the key to collect
   *  @return {any | object} if key is present, value is returned. If not all configuration is returned.
   *
   *  Note: only supports single depth
   */
  async get(
    configName: string,
    key?: string
  ): Promise<ConfigFile | ConfigType> {
    if (!(await this.exists(configName))) {
      throw new Error(ConfigString.NotFound);
    }

    const json = await fs.readJson(this.getConfigPath(configName));
    return key ? json[key] : json;
  }

  /**
   *  updates a value in config, set by Key
   *  @param {string} configName the config file to change
   *  @param {string} key the key to update
   *  @param {any} value the value to update config to
   *  @return {any} returns the value, or throws error if not found.
   *
   *  Note: only supports single depth
   */
  async set(
    configName: string,
    key: string,
    value: ConfigType
  ): Promise<ConfigType> {
    if (!(await this.exists(configName))) {
      throw new Error(ConfigString.NotFound);
    }

    // this is not the best solution
    // if the JSON file is large it'll be loading/unloading to change one value
    const json = (await this.get(configName)) as ConfigFile;

    json[key] = value;
    await fs.writeJson(this.getConfigPath(configName), json);

    return value;
  }

  private getConfigPath(configName: string): string {
    return join(this.cwd, `${configName}${this.fileExt}`);
  }
}
