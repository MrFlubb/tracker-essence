import { FuelEntry } from '../types';

const POST_WEBHOOK_URL = 'https://workflow.aurelienchardon.com/webhook/plein-essence';
const GET_WEBHOOK_URL = 'https://workflow.aurelienchardon.com/webhook/essence-graphique';

/**
 * Sends fuel data to the webhook.
 * Maps frontend 'prix' to backend 'total' and calculates unit price.
 */
export const postFuelLog = async (data: FuelEntry): Promise<void> => {
  try {
    // 1. Conversion explicite et nettoyage des entrées
    const litres = Number(data.litres) || 0;
    const kilometres = Number(data.kilometres) || 0;
    const total = Number(data.prix) || 0; // 'prix' du formulaire correspond au 'total' payé
    
    // 2. Calcul du prix au litre sécurisé
    let prixParLitre = 0;
    if (litres > 0 && total > 0) {
      prixParLitre = total / litres;
    }

    // 3. Création de la charge utile (Payload)
    // Note: On envoie des nombres purs (pas de strings) pour faciliter le travail de n8n
    const payload = {
      kilometres: kilometres,
      litres: litres,
      total: total,
      // On envoie les deux clés 'prix' et 'total' pour compatibilité maximale
      prix: total, 
      prix_par_litre: Number(prixParLitre.toFixed(3)),
      date: new Date().toISOString(), 
    };

    console.log("🚀 Envoi au Webhook (Payload):", JSON.stringify(payload, null, 2));

    const response = await fetch(POST_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const text = await response.text();
    console.log('✅ Réponse du serveur:', text);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi:', error);
    throw error;
  }
};

/**
 * Fetches fuel stats from the webhook.
 */
export const fetchFuelStats = async (): Promise<any> => {
  try {
    // Ajout d'un timestamp pour éviter le cache navigateur (Cache busting)
    const bustCache = `?t=${Date.now()}`;
    const response = await fetch(`${GET_WEBHOOK_URL}${bustCache}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
};