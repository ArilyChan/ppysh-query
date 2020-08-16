# ppysh-query
为聊天bot设计的osu查询器
被api访问限制而妥协的产物

不知道为什么UserInfo不复制一份就会出错

## 使用方法
### osu apiKey
你需要先申请一个[osu apiKey](https://old.ppy.sh/p/api/)
可能需要先登录再重新访问该地址

### 安装
```sh
npm install ArilyChan/ppysh-query
```

### 使用
```javascript
const ppyshQuery = require("ppysh-query");
let psq = new ppyshQuery({
    admin: [123456], // 管理员列表，必要
    apiKey: "把你的apikey放这里", // osu Api token，必要
    database: "./Opsbot-v1.db", // 数据库路径，默认为根目录下的Opsbot-v1.db
    prefix: "*", // 指令前缀，必须为单个字符，默认为*
    prefix2: "%" // 备用指令前缀，必须为单个字符，默认为%
})

let reply = await psq.apply(
    userId, // qqId
    message // 指令
    );
```

### 指令
详细指令说明可以输入help查看
