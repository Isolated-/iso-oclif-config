import * as path from 'path';
import * as fs from 'fs-extra';
import chai from 'chai';
import promised from 'chai-as-promised';
import { test, expect, Config } from '@oclif/test';
import { ConfigService } from '../../src/config/config.service';
import { ConfigString } from '../../src/config/config.string';

chai.use(promised);

const configName = 'user-config';
const fileName = configName + '.json';

describe('ConfigService unit test', () => {
  let cwd: string;
  let service: ConfigService;

  before(async () => {
    cwd = path.join(__dirname, 'tmp');

    if (!(await fs.pathExists(cwd))) {
      await fs.mkdir(cwd);
    }
  });

  beforeEach(async () => {
    service = new ConfigService(cwd);
  });

  it('should create an instance of ConfigService', () => {
    expect(service).to.be.instanceOf(ConfigService);
  });

  describe('.set()', () => {
    it('should throw an error: configuration file does not exist', async () => {
      return expect(service.set(configName, 'status', 2)).to.be.rejectedWith(
        ConfigString.NotFound
      );
    });

    it('should update a key and return the value', async () => {
      const data = { status: 1 };

      await service.create(configName, data);

      let value: any = await service.set(configName, 'status', 2);
      expect(value).to.equal(2);

      value = await service.get(configName, 'status');
      expect(value).to.equal(2);
    });
  });

  describe('.get()', () => {
    it('should throw an error: configuration file does not exist', async () => {
      return expect(service.get(configName)).to.be.rejectedWith(
        ConfigString.NotFound
      );
    });

    it('should return all of the configuration', async () => {
      const data = {
        status: 1,
        update: 'some',
      };

      await service.create(configName, data);
      const config = await service.get(configName);
      expect(config).to.include(data);
    });

    it('should only return a single value', async () => {
      const data = {
        status: 1,
        update: 'some',
        failed: false,
      };

      await service.create(configName, data);
      let config = await service.get(configName, 'status');
      expect(config).to.equal(data.status);

      config = await service.get(configName, 'update');
      expect(config).to.equal(data.update);

      config = await service.get(configName, 'failed');
      expect(config).to.equal(data.failed);

      config = await service.get(configName, 'unknown');
      expect(config).to.be.undefined;
    });
  });

  describe('.create()', () => {
    it('should throw an error: configuration file already exists', async () => {
      const fullPath = path.join(cwd, fileName);
      const data = { status: 1 };

      await fs.writeJson(fullPath, data);

      return expect(service.create('user-config', data)).to.be.rejectedWith(
        'configuration file already exists'
      );
    });

    it('should create a configuration file and return the new file path', async () => {
      const fullPath = path.join(cwd, fileName);
      const data = { status: 1 };

      const result = await service.create(configName, data);
      expect(result).to.equal(fullPath);

      const file = await fs.pathExists(fullPath);
      expect(file).to.be.true;
    });
  });

  describe('.exists()', () => {
    it('should return true: configuration file exists', async () => {
      await service.create(configName, {});
      expect(await service.exists(configName)).to.be.true;
    });

    it('should return false: configuration file does not exist', async () => {
      expect(await service.exists(configName)).to.be.false;
    });
  });

  describe('.delete()', () => {
    it('should throw error: configuration file does not exist', async () => {
      return expect(service.delete(configName)).to.be.rejectedWith(
        'configuration file does not exist'
      );
    });

    it('should delete the configuration file', async () => {
      const result = await service.create(configName, {});
      expect(result).to.equal(path.join(cwd, fileName));

      let exists = await service.exists(configName);
      expect(exists).to.be.true;

      const deleted = await service.delete(configName);
      expect(deleted).to.be.true;

      exists = await service.exists(configName);
      expect(exists).to.be.false;
    });
  });

  afterEach(async () => {
    await fs.remove(path.join(cwd, fileName));
  });

  after(async () => {
    await fs.remove(cwd);
  });
});
