# mongolize

A mongo ORM base on mongoose, changed some method to look like sequelize.  
一个基于 `mongoose` 制作的 mongo ORM, 更改了一些方法使其用起来更像 `sequelize`

# Installation
`npm install mongolize`

# Usage

```javascript
// create
const Mongolize = require('mongolize');

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
    scopes: { // deprecated
      adult: { age: { $gte: 18 } },
    },
  },
);

class User extends UserModel {
  static findAllAdults() {
    return this.findAll({age:{$gte:18}});
  }
  
  get nameAndAge() { // virtual attribute
    return `${this.name}&${this.age}`;
  }
}

async function main() {
  await User.truncate();

  const user = await User.create({ name: 'Tom', age: 18 });
  await user.update({ age: 20 }); // in practice, updateOne by {_id: user.id}
  await user.sync([name]); // sync fields from DB
  
  // const users = await User.scope('adult').find(); // deprecated
  const users = await User.findAllAdults(); // recommended
  // ... 
}

main();
```

[more example and test case](https://github.com/GeekBerry/mongolize/blob/master/test.js)
