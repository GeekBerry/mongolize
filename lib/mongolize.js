const mongoose = require('mongoose');
const modelClass = require('./model_class');

// 对于 nodejs v8 以上, mongoose.Promise === Promise

class Mongolize extends mongoose.Connection {
  // 参考 mongoose.createConnection
  constructor({
    database,
    servers = [
      {
        host: 'localhost',
        port: '27017',
      },
    ],

    user = undefined,
    pass = undefined,
    poolSize = 5,
    keepAlive = true,
    authSource = undefined, // 验证源
    replicaSet = undefined, // 连接多个数据库时需要设置
    autoReconnect = true,
    useCreateIndex = true,
    useNewUrlParser = true,
    ...rest
  } = {}) {
    if (!database) {
      throw new Error('database could not be empty');
    }

    super(mongoose); // 会加载 mongoose 中的配置参数
    mongoose.connections.push(this);

    const addresses = servers.map(v => `${v.host}:${v.port}`).join(',');
    const url = `mongodb://${addresses}/${database}`;
    this.openUri(url, {
      user,
      pass,
      poolSize,
      keepAlive,
      authSource,
      replicaSet,
      autoReconnect,
      useCreateIndex,
      useNewUrlParser,
      ...rest,
    });

    this.Types = mongoose.Schema.Types;
  }

  /**
   * 定义一个 Model
   * @param name {String}
   * @param schemaObject {Object}
   * @param options {Object}
   * @return {Model}
   */
  define(name, schemaObject, options) {
    const schema = new mongoose.Schema(schemaObject, options);
    const Model = this.model(name, schema, name); // 设置 model 和 collection 同名
    return modelClass(Model);
  }
}

module.exports = Mongolize;
