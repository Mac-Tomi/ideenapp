const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendNewIdeaNotification = functions
  .region("europe-west1")
  .firestore.document("ideen/{ideaId}")
  .onCreate(async (snapshot) => {
    const idea = snapshot.data();
    if (!idea.author || !idea.text) return null;

    const tokensSnapshot = await admin
      .firestore()
      .collection("fcm_tokens")
      .where("author", "!=", idea.author)
      .get();

    if (tokensSnapshot.empty) return null;

    const tokens = tokensSnapshot.docs.map((doc) => doc.data().token);

    const response = await admin.messaging().sendEachForMulticast({
      notification: {
        title: `💡 Neue Idee von ${idea.author}`,
        body:
          idea.text.length > 100
            ? idea.text.substring(0, 100) + "…"
            : idea.text,
      },
      tokens,
    });

    const batch = admin.firestore().batch();
    let hasDeletes = false;
    for (let i = 0; i < response.responses.length; i++) {
      if (!response.responses[i].success) {
        const snap = await admin
          .firestore()
          .collection("fcm_tokens")
          .where("token", "==", tokens[i])
          .get();
        snap.docs.forEach((doc) => {
          batch.delete(doc.ref);
          hasDeletes = true;
        });
      }
    }
    if (hasDeletes) await batch.commit();
    return null;
  });
