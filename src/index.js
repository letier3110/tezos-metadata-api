const express = require("express");
const cors = require("cors");
const consola = require("consola");
const getMetadata = require("./metadata");
const { port } = require("./config");
const { isNumeric, isValidContract, fromTokenSlug } = require("./utils");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1000kb" }));
app.get("/healthz", (_, res) => {
  res.send({ message: "OK" }).status(200);
});

app.get("/metadata/:address/:tokenId", async (req, res) => {
  const { address, tokenId } = req.params;
  if (!address || !isValidContract(address) || !isNumeric(tokenId)) {
    consola.error(
      `Validation failed for contract ${address} and tokenId:${tokenId}`
    );
    return res
      .send({ message: "Please, provide a valid token address and token id" })
      .status(400);
  }

  try {
    let metadata;
    try {
      metadata = await getMetadata(address, tokenId);
    } catch {
      metadata = {
        decimals: 0,
        symbol: address,
        name: "Unknown Token",
      };
    }

    res.send(metadata).status(200);
  } catch (e) {
    res
      .send({ message: "Could not fetch metadata for provided token" })
      .status(400);
  }
});

app.post("/", async (req, res) => {
  const promises = [];
  try {
    for (const slug of req.body) {
      const { address, tokenId } = fromTokenSlug(slug);

      if (!address || !isValidContract(address) || !isNumeric(tokenId)) {
        consola.error(
          `Validation failed for contract ${address} and tokenId:${tokenId}`
        );
        return res
          .send({
            message: "Please, provide a valid token address and token id",
          })
          .status(400);
      }

      promises.push(getMetadata(address, tokenId).catch(() => null));
    }

    res.json(await Promise.all(promises));
  } catch (e) {
    res
      .send({ message: "Could not fetch metadata for provided tokens" })
      .status(400);
  }
});

app.listen(port, () =>
  consola.success(`Tezos token metadata server is listening on port ${port}`)
);
