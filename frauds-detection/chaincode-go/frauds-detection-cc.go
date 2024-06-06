package main

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	pb "github.com/hyperledger/fabric-protos-go/peer"
)

// SuppliesChaincode example simple Chaincode implementation
type SuppliesChaincode struct {
}

type Supply struct {
	Fuel			float64
}

type Bmc struct {
    Id                  string
	FuelType			string
    TotalSupplied       int
	Rating				float64
	SuppliesList 		map[string]Supply
}

type LastSupply struct {
	BmcKey		string
    Fuel    	float64
    Odometer 	float64
}

type Vehicle struct {
    Id               string
    Perfil			 string
	KmDriven 		 float64
	ConsumedFuel  	 float64
	Rating           float64
    Consumption      float64
    TankCapacity     int
    LastSupply   	 LastSupply
}


func (t *SuppliesChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	fmt.Println("Init method gets called")

	return shim.Success(nil)
}

func (t *SuppliesChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	fmt.Println("Invoke method gets called")
	function, args := stub.GetFunctionAndParameters()
	if function == "addBmc" {
		return t.addBmc(stub, args)
	} else if function == "addVehicle" {
		return t.addVehicle(stub, args)
	} else if function == "addSupply" {
		return t.addSupply(stub, args)
	} else if function == "evaluateBmcRating" {
		return t.evaluateBmcRating(stub, args)
	} else if function == "evaluateAllBmcRating" {
		return t.evaluateAllBmcRating(stub)
	} else if function == "delete" {
		return t.delete(stub, args)
	} else if function == "query" {
		return t.query(stub, args)
	}

	return shim.Error("Invalid invoke function name (). Expecting \"invoke\" \"delete\" \"query\", Received " + function)
}

func (t *SuppliesChaincode) addBmc(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	fmt.Println("add BMC method gets called")
	var bmcData struct {
		Id            string  `json:"id"`
		FuelType      string  `json:"fuelType"`
	}
	var err error

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1, {id, fuelType}")
	}

	err = json.Unmarshal([]byte(args[0]), &bmcData)
    if err != nil {
        return shim.Error(err.Error())
    }

	bmc := Bmc{
		Id: bmcData.Id,
		FuelType: bmcData.FuelType,
		TotalSupplied: 0,
		SuppliesList: make(map[string]Supply),
	}

    bmcAsBytes, err := json.Marshal(bmc)
    if err != nil {
        return shim.Error(err.Error())
    }

    err = stub.PutState("B" + bmcData.Id, bmcAsBytes)
    if err != nil {
        return shim.Error(err.Error())
    }

	fmt.Printf("Successfully added BMC %s into the ledger with the key B%s\n", args[0], bmcData.Id)

    return shim.Success(nil)
}

func (t *SuppliesChaincode) addVehicle(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	fmt.Println("add Vehicle method gets called")
	var vehicleData struct {
		Id            string  `json:"id"`
		Perfil        string  `json:"perfil"`
		Consumption   float64 `json:"consumption"`
		TankCapacity  int     `json:"tankCapacity"`
		Odometer  	  float64 `json:"odometer"`
	}
	var err error

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1, {id, perfil, consumption, tankCapacity, odometer}")
	}

	err = json.Unmarshal([]byte(args[0]), &vehicleData)
	if err != nil {
		return shim.Error(err.Error())
	}

	vehicle := Vehicle{
		Id:            vehicleData.Id,
		Perfil:        vehicleData.Perfil,
		KmDriven:	   0.0,
		ConsumedFuel:  0.0,
		Consumption:   vehicleData.Consumption,
		TankCapacity:  vehicleData.TankCapacity,
		Rating:        0.0,
		LastSupply: LastSupply{
			BmcKey:   "",
			Fuel:     0,
			Odometer: vehicleData.Odometer,
		},
	}

	vehicleAsBytes, err := json.Marshal(vehicle)
	if err != nil {
		return shim.Error(err.Error())
	}

	err = stub.PutState("V"+vehicle.Id, vehicleAsBytes)
	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Printf("Successfully added Vehicle %v into the ledger with the key V%s\n", vehicle, vehicle.Id)

	return shim.Success(nil)
}

func (t *SuppliesChaincode) addSupply(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	fmt.Println("add Supply method gets called")
	var supplyData struct {
		Fuel        float64 `json:"fuel"`
		Odometer  	float64 `json:"odometer"`
		VehicleId  	string  `json:"vehicleId"`
		BmcId   	string 	`json:"bmcId"`
	}
	var vehicle Vehicle
	var bmc Bmc
	var lastBmc Bmc
	
	var err error

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1, {fuel, odometer, vehicleId, bmcId}")
	}

	err = json.Unmarshal([]byte(args[0]), &supplyData)
	if err != nil {
		return shim.Error(err.Error())
	}

	vehicleAsBytes, err := stub.GetState("V" + supplyData.VehicleId)
    if err != nil {
        return shim.Error(err.Error())
    }
    if vehicleAsBytes == nil {
        return shim.Error("Vehicle not found")
    }

    err = json.Unmarshal(vehicleAsBytes, &vehicle)
    if err != nil {
        return shim.Error(err.Error())
    }

	bmcAsBytes, err := stub.GetState("B" + supplyData.BmcId)
    if err != nil {
        return shim.Error(err.Error())
    }
    if bmcAsBytes == nil {
        return shim.Error("BMC not found")
    }

    err = json.Unmarshal(bmcAsBytes, &bmc)
    if err != nil {
        return shim.Error(err.Error())
    }

	if vehicle.LastSupply.Odometer > supplyData.Odometer {
		return shim.Error("Odometer lower then previous value")
	}

	vehicle.KmDriven += supplyData.Odometer - vehicle.LastSupply.Odometer
	vehicle.ConsumedFuel += vehicle.LastSupply.Fuel
	if vehicle.ConsumedFuel > 0 {
		realConsumption := vehicle.KmDriven / vehicle.ConsumedFuel
		vehicle.Rating = realConsumption / vehicle.Consumption 
	}

	if vehicle.LastSupply.BmcKey != "" {

		lastBmcAsBytes, err := stub.GetState("B" + vehicle.LastSupply.BmcKey)
		if err != nil {
			return shim.Error(err.Error())
		}
		if lastBmcAsBytes == nil {
			return shim.Error("BMC not found")
		}
	
		err = json.Unmarshal(lastBmcAsBytes, &lastBmc)
		if err != nil {
			return shim.Error(err.Error())
		}

		returned_value, boolean_exists := lastBmc.SuppliesList["V"+vehicle.Id]
		if(boolean_exists){
			lastBmc.SuppliesList["V"+vehicle.Id] = Supply{Fuel: (returned_value.Fuel + vehicle.LastSupply.Fuel)}
		} else {
			lastBmc.SuppliesList["V"+vehicle.Id] = Supply{Fuel: vehicle.LastSupply.Fuel}
		}

		lastBmc.TotalSupplied += int(vehicle.LastSupply.Fuel)

		updatedBmcAsBytes, err := json.Marshal(lastBmc)
		if err != nil {
			return shim.Error(err.Error())
		}

		err = stub.PutState("B"+lastBmc.Id, updatedBmcAsBytes)
		if err != nil {
			return shim.Error(err.Error())
		}

	}

	vehicle.LastSupply.BmcKey = supplyData.BmcId
	vehicle.LastSupply.Odometer = supplyData.Odometer
	vehicle.LastSupply.Fuel = supplyData.Fuel



	updatedVehicleAsBytes, err := json.Marshal(vehicle)
	if err != nil {
		return shim.Error(err.Error())
	}

	err = stub.PutState("V"+vehicle.Id, updatedVehicleAsBytes)
	if err != nil {
		return shim.Error(err.Error())
	}
	
	fmt.Printf("Successfully updated data in the ledger\n")

	return shim.Success(nil)
}

// Updates bmc Rating from state
func (t *SuppliesChaincode) evaluateBmcRating(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	fmt.Println("evaluate bmc rating method gets called")
	var data struct {
		Id            string  `json:"id"`
	}
	var bmc Bmc
	var bmcRating float64
	var vehicle Vehicle
	var err error

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1, id")
	}
	
	err = json.Unmarshal([]byte(args[0]), &data)
    if err != nil {
        return shim.Error(err.Error())
    }

	// Get the state from the ledger
	bmcAsBytes, err := stub.GetState(data.Id)
	if err != nil {
		jsonResp := "{\"Error\":\"Failed to get state for " + data.Id + "\"}"
		return shim.Error(jsonResp)
	}

    err = json.Unmarshal(bmcAsBytes, &bmc)
    if err != nil {
        return shim.Error(err.Error())
    }

    for vehicleKey, supply := range bmc.SuppliesList {
		vehicleAsBytes, err := stub.GetState(vehicleKey)
		if err != nil {
			jsonResp := "{\"Error\":\"Failed to get state for " + vehicleKey + "\"}"
			return shim.Error(jsonResp)
		}
	
		err = json.Unmarshal(vehicleAsBytes, &vehicle)
		if err != nil {
			return shim.Error(err.Error())
		}
		bmcRating += vehicle.Rating * supply.Fuel
    }    

	bmcRating /= float64(bmc.TotalSupplied)

	bmc.Rating = bmcRating

	updatedBmcAsBytes, err := json.Marshal(bmc)
	if err != nil {
		return shim.Error(err.Error())
	}

	err = stub.PutState(data.Id, updatedBmcAsBytes)
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(updatedBmcAsBytes)
}

// Updates bmc Rating from state
func (t *SuppliesChaincode) evaluateAllBmcRating(stub shim.ChaincodeStubInterface) pb.Response {
	fmt.Println("evaluate all bmcs rating method gets called")
	var bmc Bmc
	var bmcRating float64
	var vehicle Vehicle
	var err error

	var results []Bmc

    resultsIterator, err := stub.GetStateByRange("B", "C")
    if err != nil {
        return shim.Error(err.Error())
    }
    defer resultsIterator.Close()



    for resultsIterator.HasNext() {
        data, err := resultsIterator.Next()
        if err != nil {
            return shim.Error(err.Error())
        }
		
		err = json.Unmarshal(data.Value, &bmc)
		if err != nil {
			return shim.Error(err.Error())
		}
	
		for vehicleKey, supply := range bmc.SuppliesList {
			vehicleAsBytes, err := stub.GetState(vehicleKey)
			if err != nil {
				jsonResp := "{\"Error\":\"Failed to get state for " + vehicleKey + "\"}"
				return shim.Error(jsonResp)
			}
		
			err = json.Unmarshal(vehicleAsBytes, &vehicle)
			if err != nil {
				return shim.Error(err.Error())
			}
			bmcRating += vehicle.Rating * supply.Fuel
		}    
	
		bmcRating /= float64(bmc.TotalSupplied)
	
		bmc.Rating = bmcRating
	
		updatedBmcAsBytes, err := json.Marshal(bmc)
		if err != nil {
			return shim.Error(err.Error())
		}

		err = stub.PutState(data.Key, updatedBmcAsBytes)
		if err != nil {
			return shim.Error(err.Error())
		}

		results = append(results, bmc)
	}

	resultsJSON, err := json.Marshal(results)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(resultsJSON)
}

// Deletes an entity from state
func (t *SuppliesChaincode) delete(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	fmt.Println("delete method gets called")
	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2 (id, type)")
	}

	id := args[0]

	// Delete the key from the state in ledger
	err := stub.DelState(id)
	if err != nil {
		return shim.Error("Failed to delete state")
	}

	return shim.Success(nil)
}

// query callback representing the query of a chaincode
func (t *SuppliesChaincode) query(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	fmt.Println("query method gets called")
	var data struct {
		Id            string  `json:"id"`
	}
	// var obj any
	// var ObjBytes []byte 

	var err error

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1, {id}")
	}

	err = json.Unmarshal([]byte(args[0]), &data)
    if err != nil {
        return shim.Error(err.Error())
    }

	// Get the state from the ledger
	Objbytes, err := stub.GetState(data.Id)
	if err != nil {
		jsonResp := "{\"Error\":\"Failed to get state for " + data.Id + "\"}"
		return shim.Error(jsonResp)
	}
	
    // err = json.Unmarshal(ObjBytes, &obj)

	// if err != nil {
	// 	return shim.Error("Failed to load state")
	// }

	// fmt.Printf("Successfully query Object %+v from the ledger\n", obj)
	return shim.Success(Objbytes)
}

func main() {
	err := shim.Start(new(SuppliesChaincode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}
