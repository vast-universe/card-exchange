# Card Exchange

一个部署到 Cloudflare Workers 的最简卡密兑换站，包含：

- 用户端：卡密兑换、卡密售后查询、被封后换号
- 后台：账号类型管理、账号上传、账号实时状态检查、卡密生成、仪表盘统计
- 存储：D1
- 防刷：Turnstile

## 目录

```text
card-exchange/
  app/
  components/
  lib/
  migrations/
  public/
  types/
```

## 本地启动

1. 安装依赖

```bash
npm install
```

2. 复制并填写 Cloudflare 配置

- 在 `wrangler.jsonc` 里填好 D1 `database_id`
- 在 Cloudflare Secret 里设置：
  - `ADMIN_PASSWORD`
  - `SESSION_SECRET`
  - `CARD_HASH_SECRET`
  - `SUPPLY_API_TOKEN`
  - `TURNSTILE_SECRET_KEY`

3. 执行本地迁移

```bash
npm run db:migrate:local
```

4. 启动开发环境

```bash
npm run dev
```

## 部署到 Cloudflare

```bash
npm run deploy
```

## 当前 MVP 边界

- 账号上传支持 `JSON` 数组、单个 `JSON` 对象和 `JSONL`
- 账号原文存入 `payload_raw`，页面展示和复制都直接用原文
- 新生成的卡密会保存明文与哈希，方便后台查看；历史老卡如果当时未保存明文则无法恢复
- `kiro*` 类型支持实时检查账号状态和额度，并在需要时自动刷新 token 后写回原文
- `kiro*` 账号原文建议包含 `accessToken/access_token`，可选 `refreshToken/refresh_token`
- 如果是 BuilderId / Enterprise 类型，额外建议带上 `clientId`、`clientSecret`、`region`
- 后台入口通过 `lib/admin-paths.ts` 里的 `ADMIN_ROUTE_SEGMENT` 控制，建议改成你自己的随机值
- 可通过 `/api/supply/cards` 对接外部自动发货平台，建议使用 `Authorization: Bearer <SUPPLY_API_TOKEN>`
- 自动队列、批量异步巡检、R2 留档暂未接入

## 自动发货平台接口

适合让外部自动发货平台来取卡密，支持 `GET` 和 `POST`。

- 接口地址：`/api/supply/cards`
- 鉴权方式：`Authorization: Bearer <SUPPLY_API_TOKEN>`
- `POST` 同时兼容 `application/json`、`application/x-www-form-urlencoded`、`multipart/form-data`
- 必填参数：`poolCode`，也兼容 `type / pool / productType / sku / pool_code / productCode / product_code / goodsCode`
- 可选参数：`count`，默认 `1`，最大 `20`，也兼容 `quantity / qty / num / amount`
- 强烈建议传：`deliveryRef`，也兼容 `requestId / orderId / orderNo / outTradeNo / tradeNo / delivery_ref`
- 也支持通过请求头传幂等键：`Idempotency-Key`
- 默认成功响应会返回 `success / code / message / msg / data / content` 等字段，方便兼容不同自动发货平台
- 如果对接 `xianyu-auto-reply-fix`，建议额外传 `responseMode=text`，直接返回纯卡密文本

示例：

```http
POST /api/supply/cards
Authorization: Bearer your-supply-token
Content-Type: application/json
```

```json
{
  "poolCode": "kiro",
  "count": 1,
  "deliveryRef": "ORDER-10001"
}
```

成功响应示例：

```json
{
  "success": true,
  "code": 0,
  "message": "已分配 1 张卡密",
  "data": {
    "poolCode": "kiro",
    "deliveryRef": "ORDER-10001",
    "reused": false,
    "count": 1,
    "cardCode": "KIRO-ABCD-EFGH-JKLM-NPQR",
    "codes": ["KIRO-ABCD-EFGH-JKLM-NPQR"],
    "content": "KIRO-ABCD-EFGH-JKLM-NPQR",
    "cards": [
      {
        "id": 12,
        "code": "KIRO-ABCD-EFGH-JKLM-NPQR",
        "poolCode": "kiro",
        "deliveryRef": "ORDER-10001",
        "deliveredAt": "2026-04-02T12:34:56.000Z",
        "aftersaleLimit": 1,
        "warrantyHours": 24
      }
    ]
  }
}
```

自动发货平台推荐配置：

```json
{
  "Authorization": "Bearer your-supply-token",
  "Content-Type": "application/json"
}
```

```json
{
  "poolCode": "kiro",
  "count": 1,
  "deliveryRef": "订单号变量"
}
```

如果对方平台只能发 `x-www-form-urlencoded`，也可以直接传：

```text
pool_code=kiro&qty=1&out_trade_no=ORDER-10001
```

如果对接 `xianyu-auto-reply-fix`，推荐配置为：

```json
{
  "Authorization": "Bearer your-supply-token",
  "Content-Type": "application/json"
}
```

```json
{
  "poolCode": "kiro",
  "count": 1,
  "deliveryRef": "订单号变量",
  "responseMode": "text"
}
```

此时接口会直接返回纯文本卡密，适合让 `xianyu-auto-reply-fix` 在消息通知模板里自行拼装发货内容。

### xianyu-auto-reply-fix 最省事配置

如果你的买家可能一次下单多份，而且希望聊天里只发 1 次完整说明 + 多行卡密，推荐在
`xianyu-auto-reply-fix` 里把卡券类型改成 `API接口`，不要继续使用 `批量数据`。

原因：

- `批量数据` 类型是一行取一条，开启多数量发货后会循环发送多次，不会自动把 10 条卡密合并成一段
- `API接口` 类型可以把订单数量变量传给 `/api/supply/cards`
- 本项目在 `responseMode=text` 下会把多张卡密用换行拼成一段纯文本返回，适合直接替换 `{DELIVERY_CONTENT}`

`xianyu-auto-reply-fix` 里建议这样填写：

- 卡券类型：`API接口`
- 请求方法：`POST`
- 请求地址：`https://card-exchange.universe-hub.workers.dev/api/supply/cards`
- 请求头：

```json
{
  "Authorization": "Bearer your-supply-token",
  "Content-Type": "application/json"
}
```

- 请求参数：

```json
{
  "poolCode": "kiro",
  "count": "{order_quantity}",
  "deliveryRef": "{order_id}",
  "responseMode": "text"
}
```

注意：

- `count` 要传 `"{order_quantity}"`，这样买家买 10 份时会一次取 10 张卡密
- 商品的“多数量发货”开关请保持关闭，否则 `xianyu-auto-reply-fix` 会按数量重复调用接口，容易多发
- `POST` 更稳妥，因为 `xianyu-auto-reply-fix` 的动态参数替换主要走 `POST` 参数配置

推荐备注模板：

```text
您好，您的订单已自动发货。

使用账号需要开启魔法节点才能使用

切号器下载：
1. MAC电脑如提示损坏 执行 sudo xattr -cr /Applications/KiroAccountManager.app 再打开app
2. 记得在切号器设置 ---> 关闭锁定模型
https://github.com/hj01857655/kiro-account-manager/releases

兑换网址：
https://card-exchange.universe-hub.workers.dev

卡密如下：
{DELIVERY_CONTENT}

使用说明：
1. 打开上方网址进入兑换页面
2. 输入卡密后按页面提示操作
3. 请尽快使用，卡密为一次性内容
4. 如遇到无法使用或提示异常，请及时联系我处理
```
# card-exchange
