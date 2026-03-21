import axios from "axios";
import axiosRetry from "axios-retry";
import { z } from "zod";

// 🔁 Retry Logic
axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
});

// ✅ Validation Schema
const schema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  serviceCategory: z.string().optional(),
  country: z.string().optional(),
});

export const handleWixWebhook = async (req, res) => {
  try {
    console.log("📥 Incoming Data:", req.body);

    // 🔐 API Key Security
    const apiKey = req.headers["x-api-key"];
    if (apiKey !== process.env.API_KEY) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ✅ Validation
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error });
    }

    const {
      email,
      firstName,
      lastName,
      phone,
      company,
      serviceCategory,
      country,
    } = parsed.data;

    console.log("🔍 Processing:", email);

    // 🔍 SEARCH CONTACT
    const searchRes = await axios.post(
      "https://api.hubapi.com/crm/v3/objects/contacts/search",
      {
        filterGroups: [
          {
            filters: [
              {
                propertyName: "email",
                operator: "EQ",
                value: email,
              },
            ],
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUBSPOT_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    // 🔄 UPDATE
    if (searchRes.data.results.length > 0) {
      const contactId = searchRes.data.results[0].id;

      const updateRes = await axios.patch(
        `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,
        {
          properties: {
            firstname: firstName,
            lastname: lastName,
            phone,
            company,
            service_category: serviceCategory,
            country,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.HUBSPOT_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Contact Updated:", email);

      return res.json({
        message: "Contact updated successfully",
        data: updateRes.data,
      });
    }

    // 🆕 CREATE
    const createRes = await axios.post(
      "https://api.hubapi.com/crm/v3/objects/contacts",
      {
        properties: {
          email,
          firstname: firstName,
          lastname: lastName,
          phone,
          company,
          service_category: serviceCategory,
          country,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUBSPOT_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("🆕 Contact Created:", email);

    return res.json({
      message: "Contact created successfully",
      data: createRes.data,
    });

  } catch (error) {
    console.error("❌ HubSpot Error:", error.response?.data || error.message);

    return res.status(500).json({
      message: "Error sending to HubSpot",
      error: error.response?.data || error.message,
    });
  }
};