// AI Service for external API integration
import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import Types "../types/common";

module AIService {
    
    public class AIServiceClass() {
        // AI Proxy integration
        private let ic : actor {
            http_request : Types.HttpRequestArgs -> async Types.HttpResponse;
        } = actor "aaaaa-aa";

        // Function to call AI proxy for draft response
        public func getAIDraftResponse(queryText: Text, condition: Text): async ?Text {
            try {
                let host = "localhost:3001";
                let url = "http://" # host # "/api/query";
                
                // JSON payload for AI proxy
                let jsonPayload = "{\"queryText\":\"" # queryText # "\",\"condition\":\"" # condition # "\",\"provider\":\"mock\"}";
                let requestBodyAsBlob = Text.encodeUtf8(jsonPayload);

                let requestArgs: Types.HttpRequestArgs = {
                    url = url;
                    max_response_bytes = ?2048;
                    headers = [
                        {name = "Content-Type"; value = "application/json"},
                        {name = "Host"; value = host}
                    ];
                    body = ?requestBodyAsBlob;
                    method = #post;
                    transform = null;
                };

                let httpResponse = await (with cycles = 20_949_972_000) ic.http_request(requestArgs);

                if (httpResponse.status == 200) {
                    let responseText = switch (Text.decodeUtf8(httpResponse.body)) {
                        case null { "" };
                        case (?text) { text };
                    };
                    // Simple JSON parsing to extract response (production should use proper JSON parser)
                    if (Text.contains(responseText, #text "\"success\":true")) {
                        // Extract response from JSON - this is a simplified approach
                        let parts = Text.split(responseText, #text "\"response\":\"");
                        switch(parts.next()) {
                            case null { null };
                            case (?_first) {
                                switch(parts.next()) {
                                    case null { null };
                                    case (?second) {
                                        let responseParts = Text.split(second, #text "\",\"metadata\"");
                                        switch(responseParts.next()) {
                                            case null { null };
                                            case (?response) { ?response };
                                        };
                                    };
                                };
                            };
                        };
                    } else {
                        null
                    };
                } else {
                    Debug.print("AI Proxy HTTP Error: " # Int.toText(httpResponse.status));
                    null
                };
            } catch (error) {
                Debug.print("AI Proxy Call Failed: " # Error.message(error));
                null
            };
        };
    }
}