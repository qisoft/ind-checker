# Slots checker bot

## Get started

1. Set environment variables `BOT_TOKEN` for telegram bot and `POLL_INTERVAL` (in minutes)
2. Build the image with docker:

`docker build --build-arg BOT_TOKEN=$BOT_TOKEN --build-arg POLL_INTERVAL=$POLL_INTERVAL  [-t tag] .`
3. When you start container provide volume for `/app/data` to persist subscribed users.

## Environment variables

`BOT_TOKEN`: The token for telegram bot obtained in [BotFather](https://t.me/BotFather)

`POLL_INTERVAL`: Interval in minutes of how often bot will check for slots. Default value is 5.