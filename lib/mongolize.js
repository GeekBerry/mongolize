const assert = require('assert');
const mongoose = require('mongoose');
const modelClass = require('./model_class');

// 对于 nodejs v8 以上, mongoose.Promise === Promise

class Mongolize extends mongoose.Connection {
  // 参考 mongoose.createConnection

  /**
   *
   * @param database {string}
   * @param servers {string[]}
   * @param keepAlive {boolean}
   * @param autoReconnect {boolean}
   * @param useCreateIndex {boolean}
   * @param useNewUrlParser {boolean}
   * @param ...rest {object}
   *    user {string}
   *    pass {string}
   *    poolSize {number}
   *    authSource {string} 'admin' 验证源
   *    replicaSet {string} 连接多个数据库时需要设置
   */
  constructor({
    database,
    servers = ['localhost:27017'],
    keepAlive = true,
    autoReconnect = true,
    useCreateIndex = true,
    useNewUrlParser = true,
    ...rest
  } = {}) {
    assert(database !== undefined);
    assert(Array.isArray(servers));

    super(mongoose); // 会加载 mongoose 中的配置参数
    mongoose.connections.push(this);

    const url = `mongodb://${servers.join(',')}/${database}`;
    this.openUri(url, {
      keepAlive,
      autoReconnect,
      useCreateIndex,
      useNewUrlParser,
      ...rest,
    });
  }

  /**
   * 定义一个 Model
   * @param name {string}
   * @param schema {Schema}
   * @param collection {?string}
   * @return {Model}
   */
  model(name, schema, collection) {
    const Model = super.model(name, schema, collection || name);
    return modelClass(Model);
  }
}

module.exports = Mongolize;
module.exports.Schema = mongoose.Schema;
module.exports.Error = require('mongoose/lib/error');
