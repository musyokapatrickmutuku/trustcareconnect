import { Canister, text, Record, Vec, query, update, StableBTreeMap, Opt } from 'azle';

// Define data structures
const User = Record({
    id: text,
    name: text,
    email: text,
    role: text, // 'patient' or 'healthcare_provider'
    createdAt: text
});

const Query = Record({
    id: text,
    userId: text,
    title: text,
    description: text,
    category: text, // 'general', 'diabetes', 'medication'
    createdAt: text
});

const Response = Record({
    id: text,
    queryId: text,
    responderId: text,
    content: text,
    isAIGenerated: text, // 'true' or 'false'
    createdAt: text
});

// Initialize storage
const users = StableBTreeMap(0, text, User);
const queries = StableBTreeMap(1, text, Query);
const responses = StableBTreeMap(2, text, Response);

export default Canister({
    // User management
    createUser: update([text, text, text], text, (name, email, role) => {
        const id = `user_${Date.now()}`;
        const user = {
            id,
            name,
            email,
            role,
            createdAt: new Date().toISOString()
        };
        users.insert(id, user);
        return id;
    }),

    getUser: query([text], Opt(User), (id) => {
        return users.get(id);
    }),

    getAllUsers: query([], Vec(User), () => {
        return users.values();
    }),

    // Query management
    createQuery: update([text, text, text, text], text, (userId, title, description, category) => {
        const id = `query_${Date.now()}`;
        const queryRecord = {
            id,
            userId,
            title,
            description,
            category,
            createdAt: new Date().toISOString()
        };
        queries.insert(id, queryRecord);
        return id;
    }),

    getQuery: query([text], Opt(Query), (id) => {
        return queries.get(id);
    }),

    getAllQueries: query([], Vec(Query), () => {
        return queries.values();
    }),

    getUserQueries: query([text], Vec(Query), (userId) => {
        return queries.values().filter(query => query.userId === userId);
    }),

    // Response management
    createResponse: update([text, text, text, text], text, (queryId, responderId, content, isAIGenerated) => {
        const id = `response_${Date.now()}`;
        const response = {
            id,
            queryId,
            responderId,
            content,
            isAIGenerated,
            createdAt: new Date().toISOString()
        };
        responses.insert(id, response);
        return id;
    }),

    getResponse: query([text], Opt(Response), (id) => {
        return responses.get(id);
    }),

    getQueryResponses: query([text], Vec(Response), (queryId) => {
        return responses.values().filter(response => response.queryId === queryId);
    }),

    getAllResponses: query([], Vec(Response), () => {
        return responses.values();
    }),

    // Health check
    healthCheck: query([], text, () => {
        return "TrustCareConnect backend is running!";
    })
});