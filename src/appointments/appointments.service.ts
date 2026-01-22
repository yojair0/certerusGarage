import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';

import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { RejectAppointmentDto } from './dto/reject-appointment.dto.js';
import { UpdateAppointmentDto } from './dto/update-appointment.dto.js';
import { Appointment } from './entities/appointment.entity.js';

import { APPOINTMENT_STATUS, type AppointmentStatus } from '../common/constants/appointment-status.constant.js';
import { NOTIFICATION_TYPE, type NotificationType } from '../common/constants/notification-type.constant.js';
import { ROLE } from '../common/constants/role.constant.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { SchedulesService } from '../schedules/schedules.service.js';
import { UsersService } from '../users/users.service.js';
import { VehiclesService } from '../vehicles/vehicles.service.js';

@Injectable()
export class AppointmentsService {
  public constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly schedulesService: SchedulesService,
    private readonly usersService: UsersService,
    private readonly vehiclesService: VehiclesService,
    private readonly notificationsService: NotificationsService
  ) {}

  public async createAppointment(
    clientId: number,
    createAppointmentDto: CreateAppointmentDto
  ): Promise<Appointment> {
    const { mechanicId, vehicleId, scheduleId, hour, date, description } = createAppointmentDto;

    const mechanic = await this.usersService.findByIdOrThrow(mechanicId);
    if (mechanic.role !== ROLE.MECHANIC) {
      throw new BadRequestException('El usuario seleccionado no es un mecánico');
    }

    const vehicle = await this.vehiclesService.findOne(vehicleId);
    if (vehicle.clientId !== clientId) {
      throw new ForbiddenException('No puedes agendar citas para vehículos que no te pertenecen');
    }

    const client = await this.usersService.findByIdOrThrow(clientId);

    const schedule = await this.schedulesService.getScheduleById(scheduleId);
    if (!schedule.availableHours.includes(hour)) {
      throw new BadRequestException('La hora seleccionada no está disponible');
    }

    const appointment = this.appointmentRepository.create({
      clientId,
      mechanicId,
      vehicleId,
      scheduleId,
      hour,
      date,
      description,
      status: APPOINTMENT_STATUS.PENDING
    });

    const savedAppointment = await this.appointmentRepository.save(appointment);

    await this.schedulesService.removeHourFromSchedule(scheduleId, hour);

    // Notify Mechanic
    await this.notificationsService.createNotification({
      userId: mechanicId,
      type: NOTIFICATION_TYPE.APPOINTMENT_CREATED as NotificationType,
      title: 'Nueva Cita Agendada',
      message: `El cliente ha agendado una cita para el vehículo ${vehicle.licensePlate} el ${date} a las ${hour}`,
      metadata: { appointmentId: savedAppointment.id }
    });

    // Populate relations for response
    savedAppointment.client = client;
    savedAppointment.mechanic = mechanic;
    savedAppointment.vehicle = vehicle;
    savedAppointment.schedule = schedule;

    return savedAppointment;
  }

  public async findAll(
    userId: number,
    userRole: string,
    status: string | undefined,
    clientId: number | undefined,
    mechanicId: number | undefined,
    date: string | undefined,
  ): Promise<Appointment[]> {
    const where: FindOptionsWhere<Appointment> = {};

    if (userRole === ROLE.CLIENT) {
      where.clientId = userId;
    } else if (userRole === ROLE.MECHANIC) {
      where.mechanicId = userId;
    }

    if (clientId && userRole !== ROLE.CLIENT) {
      where.clientId = clientId;
    }
    if (mechanicId && userRole !== ROLE.MECHANIC) {
      where.mechanicId = mechanicId;
    }

    if (status) {
      where.status = status as AppointmentStatus;
    }

    if (date) {
      where.date = date;
    }

    return await this.appointmentRepository.find({
      where,
      relations: ['client', 'mechanic', 'vehicle'],
      order: { date: 'ASC', hour: 'ASC' }
    });
  }

  public async getAppointmentsByClient(clientId: number): Promise<Appointment[]> {
    return await this.appointmentRepository.find({
      where: { clientId },
      relations: ['mechanic', 'vehicle'],
      order: { date: 'ASC', hour: 'ASC' }
    });
  }

  public async getAppointmentsByMechanic(mechanicId: number): Promise<Appointment[]> {
    return await this.appointmentRepository.find({
      where: { mechanicId },
      relations: ['client', 'vehicle'],
      order: { date: 'ASC', hour: 'ASC' }
    });
  }

  public async updateAppointment(
    appointmentId: number,
    userId: number,
    userRole: string,
    updateAppointmentDto: UpdateAppointmentDto
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: ['client', 'mechanic', 'vehicle', 'schedule']
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    if (userRole === ROLE.MECHANIC && appointment.mechanicId !== userId) {
      throw new ForbiddenException('No puedes modificar citas que no te han sido asignadas');
    }

    if (userRole === ROLE.CLIENT && appointment.clientId !== userId) {
      throw new ForbiddenException('No puedes modificar citas que no te pertenecen');
    }

    if (appointment.status !== APPOINTMENT_STATUS.PENDING) {
      throw new BadRequestException('Only pending appointments can be modified');
    }

    const { status, rejectionReason } = updateAppointmentDto;

    if (status === APPOINTMENT_STATUS.REJECTED && !rejectionReason) {
      throw new BadRequestException('Rejection reason is required when rejecting an appointment');
    }

    if (status) {
      appointment.status = status;
    }

    if (rejectionReason) {
      appointment.rejectionReason = rejectionReason;
    }

    return await this.appointmentRepository.save(appointment);
  }

  public async updateAppointmentStatus(
    appointmentId: number,
    mechanicId: number,
    updateAppointmentDto: UpdateAppointmentDto
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: ['client', 'mechanic', 'vehicle', 'schedule']
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    if (appointment.mechanicId !== mechanicId) {
      throw new ForbiddenException('No puedes modificar citas que no te han sido asignadas');
    }

    if (appointment.status !== APPOINTMENT_STATUS.PENDING) {
      throw new BadRequestException('Only pending appointments can be modified');
    }

    const { status, rejectionReason } = updateAppointmentDto;

    if (status === APPOINTMENT_STATUS.REJECTED && !rejectionReason) {
      throw new BadRequestException('Rejection reason is required when rejecting an appointment');
    }

    if (status) {
      appointment.status = status;
    }

    if (rejectionReason) {
      appointment.rejectionReason = rejectionReason;
    }

    return await this.appointmentRepository.save(appointment);
  }

  public async acceptAppointment(appointmentId: number, mechanicId: number): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: ['client', 'mechanic', 'vehicle', 'schedule']
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.mechanicId !== mechanicId) {
      throw new ForbiddenException('You cannot modify appointments that have not been assigned to you');
    }

    if (appointment.status !== APPOINTMENT_STATUS.PENDING) {
      throw new BadRequestException('Only pending appointments can be accepted');
    }

    appointment.status = APPOINTMENT_STATUS.ACCEPTED;
    const savedAppointment = await this.appointmentRepository.save(appointment);

    // Notify Client
    await this.notificationsService.createNotification({
      userId: appointment.clientId,
      type: NOTIFICATION_TYPE.APPOINTMENT_ACCEPTED as NotificationType,
      title: 'Cita Aceptada',
      message: `Tu cita para el vehículo ${appointment.vehicle.licensePlate} ha sido aceptada por el mecánico`,
      metadata: { appointmentId: savedAppointment.id }
    });

    return savedAppointment;
  }

  public async rejectAppointment(
    appointmentId: number, 
    mechanicId: number, 
    rejectAppointmentDto: RejectAppointmentDto
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: ['client', 'mechanic', 'vehicle', 'schedule']
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    if (appointment.mechanicId !== mechanicId) {
      throw new ForbiddenException('No puedes modificar citas que no te han sido asignadas');
    }

    if (appointment.status !== APPOINTMENT_STATUS.PENDING) {
      throw new BadRequestException('Solo las citas pendientes pueden ser rechazadas');
    }

    appointment.status = APPOINTMENT_STATUS.REJECTED;
    appointment.rejectionReason = rejectAppointmentDto.rejectionReason;
    
    const savedAppointment = await this.appointmentRepository.save(appointment);

    await this.schedulesService.addHourToSchedule(appointment.scheduleId, appointment.hour);

    // Notify Client
    await this.notificationsService.createNotification({
      userId: appointment.clientId,
      type: NOTIFICATION_TYPE.APPOINTMENT_REJECTED as NotificationType,
      title: 'Cita Rechazada',
      message: `Tu cita ha sido rechazada. Razón: ${rejectAppointmentDto.rejectionReason}`,
      metadata: { appointmentId: savedAppointment.id }
    });
    
    return savedAppointment;
  }

  public async getAppointmentById(id: number): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['client', 'mechanic', 'vehicle', 'schedule']
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    return appointment;
  }

  public async deleteAppointment(id: number, userId: number): Promise<void> {
    const appointment = await this.getAppointmentById(id);

    if (appointment.clientId !== userId) {
      throw new ForbiddenException('No puedes cancelar citas que no te pertenecen');
    }

    if (appointment.status !== APPOINTMENT_STATUS.PENDING && appointment.status !== APPOINTMENT_STATUS.ACCEPTED) {
      throw new BadRequestException('Solo las citas pendientes o aceptadas pueden ser canceladas');
    }

    await this.appointmentRepository.delete(id);

    await this.schedulesService.addHourToSchedule(appointment.scheduleId, appointment.hour);
  }
}
