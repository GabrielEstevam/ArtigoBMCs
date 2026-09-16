# Fuel-Pump Fraud Detection — Prototype Code

## Description

This repository ("ArtigoBMCs" / "frauds-detection") contains the prototype
implementation used to validate the fuel-pump fraud detection use case
described in Section 10.2 of the article *"A Witnessability-Based Framework
for Validating Blockchain Oracle Data"* (Oliveira, Vigil, and Martina). It
implements a Hyperledger Fabric blockchain application that records fueling
data submitted by customers and computes a trust rating for each gas pump
based on cross-validated consumption data, together with a large-scale
simulation used to validate the fraud-detection approach. A more detailed
evaluation of this use case, including additional experimental results, is
presented in the authors' earlier work (Oliveira et al. 2025, *Forwarding
metrology with an IoT and blockchain approach: The gas pumps use case*,
Journal of Internet Services and Applications).

This is a research prototype developed for testnet validation and is **not**
intended as production-ready software.

## Dataset Information

Not applicable as a standalone dataset file. Instead, the dataset is
assembled programmatically during the simulation (see
`GasPumpsUseCase_Simulation.ipynb`): the notebook builds a synthetic
fueling scenario parameterized with real-world figures for the year 2022
(number of gas pumps by fuel type, size of the vehicle fleet and its
consumption profile, and total fuel volume sold in Brazil that year, broken
down by vehicle profile), so as to reproduce a scenario at realistic scale.
A known, controllable amount of fraud (a volumetric deficit at a subset of
gas pumps) is then injected into this generated scenario, so that the
fraud-detection approach's accuracy can be measured against ground truth.

## Code Information

```
chaincode-go/frauds-detection-cc.go   Hyperledger Fabric chaincode (Go).
                                       Implements a "SuppliesChaincode" smart
                                       contract with the following functions:
                                         addBmc — registers a new gas pump
                                           (BMC, "bomba medidora de
                                           combustível").
                                         addVehicle — registers a new vehicle
                                           with its declared fuel consumption
                                           and tank capacity.
                                         addSupply — records a refueling
                                           event (fuel amount and odometer
                                           reading) for a vehicle at a gas
                                           pump, and updates the vehicle's
                                           trust rating by cross-validating
                                           the declared consumption against
                                           the distance actually driven
                                           since the previous refueling.
                                         evaluateBmcRating /
                                         evaluateAllBmcRating — aggregates
                                           the trust ratings of the vehicles
                                           that refueled at a given gas pump
                                           (weighted by the volume supplied)
                                           into a trust rating for that pump.
                                         query / delete — reads/removes a
                                           ledger entry by key.

application-server/app.js             Express.js REST API server that
                                       bridges HTTP requests to the Fabric
                                       network. Exposes:
                                         POST /addBmc
                                         GET  /getBmc
                                         GET  /evaluateBmcRating
                                         GET  /evaluateAllBmcRating
                                         POST /addVehicle
                                         GET  /getVehicle
                                         POST /addSupply

GasPumpsUseCase_Simulation.ipynb      Standalone Python/Jupyter notebook
                                       (not connected to the blockchain
                                       application) that simulates the 2022
                                       Brazilian fuel market at scale,
                                       injects synthetic volumetric fraud at
                                       a controllable subset of gas pumps,
                                       applies the same cross-validation
                                       logic as the chaincode together with
                                       Tukey's IQR method to flag outliers,
                                       and reports a confusion matrix
                                       (true/false positives/negatives,
                                       accuracy, precision) comparing the
                                       flagged pumps/vehicles against the
                                       known ground truth. This is the
                                       script used to validate the approach
                                       reported in the article.

initing_network.sh                    Setup script: downloads Hyperledger
                                       Fabric's official fabric-samples
                                       repository (if not already present),
                                       registers the chaincode as a Go
                                       module, brings up the Fabric test
                                       network with a certificate authority
                                       and channel, deploys the chaincode
                                       as "frauds-detection-cc", and starts
                                       the application server.

caliper/                              Hyperledger Caliper benchmark suite
                                       (vendored) used to measure the
                                       transaction throughput of the
                                       chaincode operations (adding gas
                                       pumps/vehicles/supplies, querying,
                                       and evaluating ratings). See
                                       caliper/benchmarks/scenario/
                                       frauds-detection/config.yaml for the
                                       benchmark rounds.
```

## Usage Instructions

### Blockchain application

This project builds on Hyperledger Fabric's official `test-network` and
expects to be placed as a sibling of, or copied into, a `fabric-samples/`
checkout (the `initing_network.sh` script downloads this automatically if
it is not already present).

1. Clone/extract this repository.
2. From the repository root, build the network, deploy the chaincode, and
   start the application server (exposes the REST API on port 3000) in one
   step:
   ```
   sh initing_network.sh
   ```
3. With the application server running, interact with it via its REST
   endpoints, e.g.:
   ```
   curl -X POST http://localhost:3000/addBmc \
     -H "Content-Type: application/json" \
     -d '{"id": "1", "fuelType": "gasoline"}'

   curl -X POST http://localhost:3000/addVehicle \
     -H "Content-Type: application/json" \
     -d '{"id": "1", "perfil": "car", "consumption": 12.5, "tankCapacity": 50, "odometer": 0}'

   curl -X POST http://localhost:3000/addSupply \
     -H "Content-Type: application/json" \
     -d '{"fuel": 30, "odometer": 350, "vehicleId": "1", "bmcId": "1"}'

   curl "http://localhost:3000/evaluateBmcRating" \
     -H "Content-Type: application/json" \
     -d '{"id": "B1"}'
   ```
4. (Optional) Run the Caliper performance benchmarks:
   ```
   cd caliper
   sh caliper_run.sh
   ```

### Fraud-detection simulation

Open and run `GasPumpsUseCase_Simulation.ipynb` in Jupyter (or Google
Colab). The scenario parameters (fraud rate, adoption rate, number of
biased/manipulating users, etc.) are defined near the top of the notebook
and can be adjusted to explore different conditions; the "Main routine"
section at the end runs the full simulation and prints the resulting
confusion matrices.

## Requirements

**Blockchain application:**
- Docker and Docker Compose (required by the Hyperledger Fabric test
  network)
- Go (for building the chaincode; Fabric 2.x chaincode is typically built
  with Go 1.14+)
- Node.js >= 12 and npm >= 5 (per `application-server/package.json`)
- Node dependencies (installed via `npm install`): `express`,
  `fabric-network`, `fabric-ca-client`
- `curl` and `bash` (used by `initing_network.sh` to fetch `fabric-samples`)

**Fraud-detection simulation notebook:**
- Python 3 with `numpy`, `pandas`, `scipy`, and `matplotlib`
- Jupyter Notebook/JupyterLab, or a compatible environment (e.g. Google
  Colab, which is what the notebook was originally authored in)

**Performance benchmarks:**
- Hyperledger Caliper CLI (`@hyperledger/caliper-cli`, see the root
  `package.json`)

## Methodology

Gas pumps operate in a non-broadly witnessable environment: fueling data is
only accessible during a limited time window (at the moment of fueling) and
only to the customer involved in that specific transaction, rather than to
an arbitrary set of independent witnesses. Two techniques are combined to
validate data accuracy without relying on multiple independent witnesses at
the same pump:

1. **Cross-validation.** When a vehicle refuels, the distance it has driven
   since its previous refueling is compared against the fuel it reported
   consuming, yielding an observed fuel-efficiency figure. This is compared
   against the vehicle's declared (expected) efficiency to produce a trust
   rating for that vehicle; a gas pump's rating is then the volume-weighted
   average of the ratings of the vehicles that refueled there.
2. **Outlier detection (validation by business rules).** The interquartile
   range (IQR) method (Tukey's method) is applied to the resulting ratings
   to flag pumps/vehicles whose statistics fall outside the expected range
   as potentially fraudulent.

The accuracy of this combined approach is validated in
`GasPumpsUseCase_Simulation.ipynb` through a large-scale simulation with a
known, injected ground truth of fraudulent gas pumps, reporting standard
classification metrics (accuracy, precision, and the full confusion
matrix). See Section 10.2 of the article for the full description of the
use case and its relationship to the proposed witnessability-based
framework.

## Citations

If you use this code, please cite the article it accompanies, and the
authors' earlier work presenting the complete results of this use case:

Oliveira, G. E., Vigil, M. A. G., and Martina, J. E. A Witnessability-Based
Framework for Validating Blockchain Oracle Data. *PeerJ Computer Science*
(in submission).

Oliveira, G. E., Taglialenha, P. H. S. T., Fabiane, L. F., Idalino, T. B.,
Vigil, M., and Martina, J. E. 2025. Forwarding metrology with an IoT and
blockchain approach: The gas pumps use case. *Journal of Internet Services
and Applications*, 16(1), 253–267. https://doi.org/10.5753/jisa.2025.5016

## License & Contribution Guidelines

Licensed under the Apache License 2.0 (see
`frauds-detection/application-server/package.json`). This repository
accompanies a specific publication and is not open for external
contributions.
