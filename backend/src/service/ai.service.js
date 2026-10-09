const {GoogleGenAI} = require('@google/genai')

const ai = new GoogleGenAI({});

async function generateResponse(content){

    const response = await ai.interactions.create({
        model:"gemini-3.8-flash",
        input: content
    })

    return response.output_text

}

async function generateVector(content){
    const response = await ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: content,
        config: {
            outputDimensionality: 768
        }
    })

    return response.embeddings[0].values
}

module.exports = {
    generateResponse,
    generateVector
}