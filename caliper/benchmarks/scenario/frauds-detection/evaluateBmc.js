/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";

const { assert } = require("console");
const OperationBase = require("./utils/operation-base");

/**
 * Workload module for initializing the SUT with various accounts.
 */
class Open extends OperationBase {
  /**
   * Initializes the parameters of the workload.
   */
  constructor() {
    super();
    this.id = 0;
  }

  /**
   * Teste da avaliação das BMCs

    100 BMC
    2000 Veiculo
    40 por Veiculo

    iterar por veiculo escolhendo bmc aleatória
   */

  /**
   * Assemble TXs for opening new accounts.
   */
  async submitTransaction() {
    if (this.id == 0) {
      this.id =
        (this.roundArguments.bmcCount / this.totalWorkers) * this.workerIndex;
      this.id += this.roundArguments.initId;
      console.log("worker " + this.workerIndex + " - init id " + this.id);
    }
    this.id++;
    // const bmc = Math.ceil(Math.random() * this.roundArguments.bmcCount);
    // const vehicle = Math.ceil(Math.random() * this.roundArguments.vehicleCount);

    const args = '{"id": "B' + this.id + '"}';
    await this.sutAdapter.sendRequests(
      this.createConnectorRequest("evaluateBmcRating", [args])
    );
  }
}

/**
 * Create a new instance of the workload module.
 * @return {WorkloadModuleInterface}
 */
function createWorkloadModule() {
  return new Open();
}

module.exports.createWorkloadModule = createWorkloadModule;
