import { Request, Response } from "express";
import URL from "../models/url";
import { nanoid } from "nanoid";
import validator from "validator";

// Shorten URL with unique shortId
export const shortenUrl = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { longUrl } = req.body ?? {};

  if (
    typeof longUrl !== "string" ||
    !validator.isURL(longUrl, {
      protocols: ["http", "https"],
      require_protocol: true,
    })
  ) {
    res.status(400).json({ message: "Invalid URL format" });
    return;
  }

  const serverApi = process.env.SERVER_API;
  if (!serverApi) {
    console.error("SERVER_API is not configured");
    res.status(500).json({ message: "Server configuration error" });
    return;
  }

  try {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const shortId = nanoid(7);

      try {
        await URL.create({ shortId, longUrl });

        res.status(201).json({
          shortUrl: `${serverApi.replace(/\/+$/, "")}/api/url/${shortId}`,
          message: "URL shortened successfully",
        });
        return;
      } catch (error) {
        const isDuplicateKeyError =
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === 11000;

        if (!isDuplicateKeyError || attempt === 4) {
          throw error;
        }
      }
    }
  } catch (error) {
    console.error(JSON.stringify(error, null, 2));
    res.status(500).json({ message: "Server error" });
  }
};

// Redirect URL
export const redirectUrl = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const url = await URL.findOneAndUpdate(
      { shortId: id },
      { $inc: { clicks: 1 } },
      { new: true },
    );

    if (!url) {
      res.status(404).json({ message: "URL not found" });
      return;
    }

    res.redirect(url.longUrl);
  } catch (error) {
    console.error(JSON.stringify(error, null, 2));
    res.status(500).json({ message: "Server error" });
  }
};
