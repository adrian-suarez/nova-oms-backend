import path from "path";
import {defineConfig} from "vitest/config"
import "dotenv/config";

export default defineConfig({
    test:{
        environment:"node",
        globals:true,
        include:["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
        coverage:{
            provider:"v8",
            reporter:["text","html"],
            reportsDirectory:"./coverage",
            exclude:[
                "**/*.d.ts",
                "tests/**",
                "infra/**"
            ]
        }
    },
    resolve:{
        alias:{
            "@bootstrap":path.resolve(__dirname,"./src/bootstrap"),
            "@generated": path.resolve(__dirname,"./src/generated"),

            "@lambdas": path.resolve(__dirname,"./src/lambdas"),
            "@modules": path.resolve(__dirname,"./src/modules"),
            "@shared": path.resolve(__dirname,"./src/shared"),
        }
    }
});