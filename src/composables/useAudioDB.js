const DB_NAME = "AdzanAudioDB";
const DB_VERSION = 1;
const STORE_NAME = "audios";

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "prayer",
        });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

export const useAudioDB = () => {
  const insertAudio = async (prayer, file) => {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");

      const store = transaction.objectStore(STORE_NAME);

      store.put({
        prayer,
        name: file.name,
        type: file.type,
        size: file.size,
        file,
        createdAt: new Date().toISOString(),
      });

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  };

  const getAudio = async (prayer) => {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");

      const store = transaction.objectStore(STORE_NAME);

      const request = store.get(prayer);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  };

  const getAllAudios = async () => {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");

      const store = transaction.objectStore(STORE_NAME);

      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  };

  const deleteAudio = async (prayer) => {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");

      const store = transaction.objectStore(STORE_NAME);

      store.delete(prayer);

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  };

  return {
    insertAudio,
    getAudio,
    getAllAudios,
    deleteAudio,
  };
};
