import { Api } from "../../../dist/models";
import * as t from "../../../dist/api/appointments/types";
import * as v from "../../../dist/validation";
import { db } from "../../db";

export class appointmentsService {
	private readonly collectionName: string;

	constructor() {
		this.collectionName = "PATIENTS";
		this.getAll = this.getAll.bind(this);
		this.get = this.get.bind(this);
		this.create = this.create.bind(this);
		this.update = this.update.bind(this);
		this.delete = this.delete.bind(this);
	}

	/* *
	 ! Todo: Implement pagination for this service
	*/
	async getAll(
		patientId: string,
		limit: number | null | undefined,
		direction: Api.DirectionParamEnum | undefined,
		sortByField: string | null | undefined
	): Promise<t.GetAppointmentsGetAllResponse> {
		try {
			const appointmentsQuerySnap = await db.collectionGroup(`Appointments`).where("patientId","==",patientId).get();
			const appointments: Api.AppointmentDto[] = appointmentsQuerySnap.docs
				.map((doc: { data: () => any ; }) => doc.data())
				.map((json: any) => v.modelApiAppointmentDtoFromJson("appointments", json));
			console.log("appointments",appointments)
			return {
				status: 200,
				body: {
					items: appointments,
					totalCount: appointments.length,
				},
			};
		} catch (error) {
			console.error(error);
			return {
				status: 404,
				body: {message:`something went wrong`}
			}
		}
	}

	async get(id: string): Promise<t.GetAppointmentsGetResponse> {
		try {
			const appointmentsDocSnap = (await db.collectionGroup(`Appointments`).where("slotId","==",id).get()).docs[0];
			if (!appointmentsDocSnap.exists) {
				throw new Error("no-appointment-found");
			}
			const appointments = v.modelApiAppointmentDtoFromJson("appointments", appointmentsDocSnap.data());
			console.log(appointments)
			return {
				status: 200,
				body: appointments,
			};
		} catch (error: any) {
			console.error(error);
			if (error.toString().match("no-appointments-found")) {
				return {
					status: 404,
					body: {
						message: "No appointments found with given id",
					},
				};
			}
			return {
				status: 404,
				body: {message:`something went wrong`}
			}
		}
	}

	async create(request: Api.AppointmentDto | undefined): Promise<t.PostAppointmentsCreateResponse> {
		try {
			if (!request) {
				throw new Error("invalid-inputs");
			}

			if (!request.patientId) {
				throw new Error("no-Id-found");
			}
			if (await this._checkslotExists(request.appointmentDate,request.slotTime)){
				throw new Error("slot-already-bokked");

			}
			const appointmentRef = db.collection(`${this.collectionName}/${request.patientId}/Appointments`).doc();
			request.slotId=appointmentRef.id
			const appointRequest = v.modelApiAppointmentDtoFromJson("appointments", request);
			try {
				const patient = await this._checkUserExists(request.patientId);
				await appointmentRef.set({
						...appointRequest,
						appointmentStatus: true,
						createdAt: new Date().toISOString(),
				});
				return {
					status: 201,
					body: appointRequest,
				};
			} catch (error: any) {
				if (error.toString().match("no-patient-found")) {
					throw new Error("no-patient-found");
				}
				throw error;
			}
		} catch (error: any) {
			console.error(error);
			if (error.toString().match("invalid-inputs")) {
				return {
					status: 422,
					body: {
						message: "Invalid request",
					},
				};
			}

			if (error.toString().match("no-Id-found")) {
				return {
					status: 422,
					body: {
						message: "No id found in request",
					},
				};
			}

			if (error.toString().match("slot-already-bokked")) {
				return {
					status: 422,
					body: {
						message: "appointment already exists with given date and time",
					},
				};
			}
			return {
				status: 404,
				body: {message:`something went wrong`}
			}
		}
	}

	async update(request: Api.AppointmentDto | undefined): Promise<t.PutAppointmentsUpdateResponse> {
		try {
			if (!request) {
				throw new Error("invalid-inputs");
			}

			if (!request.patientId) {
				throw new Error("no-patientId-found");
			}

			if (!request.slotId) {
				throw new Error("no-slotId-found");
			}
			if (await this._checkslotExists(request.appointmentDate,request.slotTime)){
				throw new Error("slot-already-bokked");

			}
			 
			const appointmentRequest = JSON.parse(JSON.stringify(request))
			const appointmentRef = db.collection(`${this.collectionName}/${request.patientId}/Appointments`).doc(request.slotId);
			await appointmentRef.update({
				...appointmentRequest,
				updatedAt: new Date().toISOString(),
			});
			return {
				status: 200,
				body: {
					...appointmentRequest,
				},
			};
		} catch (error: any) {
			console.error(error);
			if (error.toString().match("invalid-inputs")) {
				return {
					status: 422,
					body: {
						message: "Invalid request",
					},
				};
			}

			if (error.toString().match("no-slotId-found")) {
				return {
					status: 422,
					body: {
						message: "No slotId found in request",
					},
				};
			}
			if (error.toString().match("slot-already-bokked")) {
				return {
					status: 422,
					body: {
						message: "appointment already exists with given date and time",
					},
				};
			}

			return {
				status: 422,
				body: {
					message: "no slotId found with given info",
				},
			};		
		}
	}

	async delete(patientId:string, slotId: string): Promise<t.DeleteAppointmentsDeleteResponse> {
		try {
			await this._checkUserExists(slotId);
			const appointmentRef = (await db.collectionGroup(`Appointments`).where("slotId","==",slotId).where("patientId","==",patientId).get()).docs[0].ref
			await appointmentRef.update({
				appointmentStatus: false,
				updatedAt: new Date().toISOString(),
			});
			return {
				status: 200,
				body: {
					...appointmentRef,
					message: "appointment deleted successfully",
				},
			};
		} catch (error: any) {
			console.error(error?.response?.status);
				return {
					status: 404,
					body: {
						
						message: "appointment already deleted or no appointment found",
					},
				};
		}
	}

	private async _checkUserExists(patientId: string) {
		const response = await db.collection("PATIENTS").doc(patientId).get();
		console.log("PATIENTS",response)
		if (!response) {
			throw new Error("no-patient-found");
		}
		return response.data();
	}
	private async _checkslotExists(appointmentDate: string,slotTime:string) {
		try{
			const appD = (await db.collectionGroup(`Appointments`).where("appointmentDate","==",appointmentDate).get())
			const slTime = (await db.collectionGroup(`Appointments`).where("slotTime","==",slotTime).get()).docs[0].ref
			console.log("appD:",appD)
			console.log("slTime:",slTime)
			// db.collection("PATIENTS").get().then((querySnapshot) => {
    		// querySnapshot.forEach((doc) => {
            // console.log(`${doc.id} => ${doc.data()}`);});
		    // });
			if (appD && slTime){
				return 1
			}
			
		}
		catch{

			return 0

		}
		
	}
}
