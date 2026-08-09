import { swaggerSpec } from "../src/config/swagger.js";

const paths = Object.keys(swaggerSpec.paths);
console.log("paths:", paths);

const login = swaggerSpec.paths["/api/v1/auth/login"];
if (login) {
  const oneOf = login.post.responses["200"].content["application/json"].schema.oneOf;
  console.log("login oneOf refs:", oneOf.map((o: any) => o.$ref));
  console.log("schemas:", Object.keys(swaggerSpec.components.schemas));
}
