const axios = require("axios");

const PHONE_NUMBER_ID = "789608004245682";
const TOKEN = "EAATdyBuvzJ8BQAUBIJPEk9ZB32dZAHP6CGv9pOOXkMLPO5MdaKLZA8yqsbMhrq8BGij52PXac7f4W37LhUxTcnPfQCUNsUu79ChZCrhIxKA1w9kuRJcvgdQJq91ZAdAcZBMluqrFRDP4DwFjztmAN9u80ryBe6cghhEMSM7RLXr6G6NFKI4XpbCyCIG1PkhnzIlgZDZD";

async function checkPhoneNumber() {
  try {
    // 1. Check phone number details
    console.log("=== Checking Phone Number Details ===");
    const res = await axios.get(
      `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}`,
      {
        headers: { Authorization: `Bearer ${TOKEN}` },
        params: {
          fields: "display_phone_number,verified_name,quality_rating,account_mode,status"
        }
      }
    );
    console.log("Phone Number Info:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("Error checking phone:", err.response?.data || err.message);
  }
}

checkPhoneNumber();
