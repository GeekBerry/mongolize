const assert = require('assert');
const Mongolize = require('./index');

const DB = new Mongolize({ database: 'test' });

const UserModel = DB.define(
  'user',
  {
    name: String,
    age: {
      type: Number,
      unique: true,
      index: true,
      default: 0,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    scopes: {
      adult: { age: { $gte: 18 } },
    },
  },
);

class User extends UserModel {
  get nameAndAge() {
    return `${this.name}&${this.age}`;
  }
}

// ============================================================================
let ret;

async function createTest() {
  await User.truncate();

  const user = await User.create({ name: 'Tom', age: 18 });
  assert(user.name === 'Tom');
  assert(user.age === 18);
  assert(user.nameAndAge === 'Tom&18'); // get attribute by DAO

  try {
    await User.create({ name: 'Tom', age: 18 });
  } catch (e) {
    assert(e.code === 11000); // duplicate key error
  }
}

async function testFind() {
  await User.truncate();
  const userTom = await User.create({ name: 'Tom', age: 18 });
  const userJerry = await User.create({ name: 'Jerry', age: 17 });

  // find by scope
  const users = await User.scope('adult').find();
  assert(users.length === 1);
  assert(users[0].name === userTom.name);

  // findById: if id not exist, return null
  ret = await User.findById('888888888888888888888888');
  assert(ret === null);

  // getById: auto throw Error
  try {
    await User.getById('888888888888888888888888');
  } catch (e) {
    assert(e instanceof Mongolize.Error.DocumentNotFoundError);
  }

  // getById: get one by id
  ret = await User.getById(userTom.id);
  assert(ret.name === userTom.name);

  // getAllByIds: find all models by ids at once
  ret = await User.getAllByIds([userTom.id, userJerry.id]);
  assert(ret.length === 2);

  // getAllByIds: auto throw Error if any of ids can not be found
  try {
    await User.getAllByIds([userTom.id, '888888888888888888888888']);
  } catch (e) {
    assert(e instanceof Mongolize.Error.DocumentNotFoundError);
  }
}

async function testSecureUndefinedValue() {
  await User.truncate();
  const userTom = await User.create({ name: 'Tom', age: 18 });

  // findAll: secure use "undefined" type filter, and not equivalent "null" like mongoose any more
  ret = await User.findAll({ name: 'Tom', age: undefined });
  assert(ret.length === 1);
  assert(ret[0].id === userTom.id);

  ret = await User.updateOne({ name: 'Tom', age: undefined }, { name: undefined, age: 20 });
  assert(ret === true);

  ret = await User.findById(userTom.id);
  assert(ret.name === 'Tom');
  assert(ret.age === 20);

  // "findOne", "deleteOne" also can use "undefined" securely

  // not allowed to update without any condition
  try {
    await User.updateOne({}, { age: 24 });
  } catch (e) {
    assert(e instanceof Mongolize.Error.ValidatorError);
  }

  // not allowed to delete without any condition
  try {
    await User.deleteOne({ name: undefined });
  } catch (e) {
    assert(e instanceof Mongolize.Error.ValidatorError);
  }
}

async function testSyncAndUpdate() {
  await User.truncate();
  const user = await User.create({ name: 'Tom', age: 18 });

  try {
    ret = await User.updateById('888888888888888888888888', { age: 20 });
  } catch (e) {
    assert(e instanceof Mongolize.Error.DocumentNotFoundError);
  }

  ret = await User.updateById(user.id, { age: 20 });
  assert(ret === true); // number of modified is 1

  const shadow = await User.findById(user.id);
  assert(shadow.age === 20);

  // update: change model value too
  await user.update({ name: 'Tony', age: 22 });
  assert(user.name === 'Tony');
  assert(user.age === 22);

  // sync: find some fields (by id) and set them to model
  await shadow.sync(['age']);
  assert(shadow.name === 'Tom');
  assert(shadow.age === 22);

  // sync: find all fields (by id) and set them to model
  await shadow.sync();
  assert(shadow.name === 'Tony');
  assert(shadow.age === 22);
}

async function testDelete() {
  await User.truncate();

  try {
    ret = await User.deleteById('888888888888888888888888');
  } catch (e) {
    assert(e instanceof Mongolize.Error.DocumentNotFoundError);
  }

  const user = await User.create({ name: 'Tom', age: 18 });
  ret = await User.deleteById(user.id);
  assert(ret === true);
}

// ============================================================================
async function test() {
  await createTest();
  await testFind();
  await testSecureUndefinedValue();
  await testSyncAndUpdate();
  await testDelete();

  DB.close();
}

test();
