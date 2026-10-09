const { Pinecone } = require('@pinecone-database/pinecone')

const pc = new Pinecone({apiKey: process.env.PINCONE_API_KEY});

const myGptCloneIndex = pc.Index('my-gpt-clone')


async function createMemory({ vectors, metadata, messageId }) {

    const record = {
        id: messageId,
        values: vectors,
        metadata: metadata
    }

    // console.log("record:", record)

    await myGptCloneIndex.upsert({
        records: [record]
    })

    // console.log("UPsert successful")
}

async function queryMemory({queryVector,limit=5,metadata}){

    const data = await myGptCloneIndex.query({
        vector: queryVector,
        topK: limit,
        filter: metadata,
        includeMetadata: true
    })

    return data.matches

}

module.exports = {
    createMemory,
    queryMemory
}