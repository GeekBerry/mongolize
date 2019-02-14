# mongolize

A mongo ORM base on mongoose, changed some method to look like sequelize.  
一个基于 `mongoose` 制作的 mongo ORM, 更改了一些方法使其用起来更像 `sequelize`

# Installation
`npm install mongoose`

# Usage

```javascript
const mongolize = new Mongolize({ database: 'test' });

const User = mongolize.define(
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
    lessons: [Lesson],
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

async function main() {
  await User.truncate();

  const user = await User.create({ name: 'Jim', age: 16, lessons: [{ name: 'english' }] });
  await user.update({ age: 20 });
  
  const users = await User.scope('adult').find();
  // ... 
}

main();
```
