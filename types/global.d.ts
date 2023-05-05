interface IAppSettings {
  readonly port: number;
  readonly body_limit: string;
  readonly body_parameter_limit: number;
}

interface ICorsSettings {
  readonly allowed_origins: string[];
  readonly allowed_paths: string[];
  readonly allowed_methods: string[];
  readonly allowed_credentials: boolean;
  readonly allowed_headers: string[];
}

interface ILogSettings {
  readonly level: string;
  readonly silence: string[];
}

interface ICurrentUser {
  id: number;
}

interface IGraphQLSettings {
  graphiql: boolean;
}

interface IGraphQLRemoteApi {
  [api_name: string]: string;
}
