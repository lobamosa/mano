import env from "@kosko/env";
import { create } from "@socialgouv/kosko-charts/components/app";

const tag = process.env.GITHUB_SHA;

const manifests = create("dashboard", {
  env,
  config: {
    containerPort: 80,
    subDomainPrefix: "dashboard-",
    image: `ghcr.io/socialgouv/mano/dashboard:sha-${tag}`,
  },
  deployment: {
    // private registry need a registry secret
    imagePullSecrets: [{ name: "regcred" }],
    container: {
      resources: {
        requests: {
          cpu: "100m",
          memory: "128Mi",
        },
        limits: {
          cpu: "500m",
          memory: "256Mi",
        },
      },
      startupProbe: {
        initialDelaySeconds: 30,
      },
    },
  },
});

export default manifests;
