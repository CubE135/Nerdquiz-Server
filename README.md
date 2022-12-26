# Nerdquiz

Frontend for a basic trivia game

## Usage

```bash
docker run --name nerdquiz-server -p 3001:3001 -d -e ORIGIN_URL="http://localhost:3000" cube135/nerdquiz-server
```

*Replace `ORIGIN_URL` variable with hostname/ip & port of your [Nerdquiz Frontend](https://hub.docker.com/r/cube135/nerdquiz).*


## Development

In order to run the app in development mode, execute the following command in a terminal:

```bash
node ./index.js
```

If you want to deploy with docker, run the following commands:

```bash
docker build . -t something/nerdquiz-server
```

Then, run the command from the "Usage" Section above with the corresponding image name.

## License
[MIT](https://choosealicense.com/licenses/mit/)