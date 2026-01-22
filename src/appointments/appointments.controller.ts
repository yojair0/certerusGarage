import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Request, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AppointmentsService } from './appointments.service.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { UpdateAppointmentDto } from './dto/update-appointment.dto.js';

import { type AuthRequest } from '../auth/interfaces/auth-request.interface.js';
import { ROLE } from '../common/constants/role.constant.js';
import { ApiResponse, SafeAppointmentForClient, SafeAppointmentForMechanic, SafeAppointmentWithSimpleClient, toSafeAppointmentForClient, toSafeAppointmentForMechanic, toSafeAppointmentWithSimpleClient } from '../common/index.js';
import { RoleGuard, Roles } from '../guards/role.guard.js';

@Controller('appointments')
@UseGuards(AuthGuard('jwt'))
export class AppointmentsController {
  private readonly logger = new Logger('AppointmentsController');

  public constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  public async listAppointments(
    @Request() req: AuthRequest,
    @Query('status') status: string | undefined,
    @Query('clientId') clientId: number | undefined,
    @Query('mechanicId') mechanicId: number | undefined,
    @Query('date') date: string | undefined,
  ): Promise<ApiResponse<SafeAppointmentForClient[] | SafeAppointmentForMechanic[]>> {
    this.logger.debug(`📥 Obtener citas para: ${req.user.email} (${req.user.role})`);
    this.logger.debug(`   Filtros -> status: ${status}, date: ${date}`);

    const appointments = await this.appointmentsService.findAll(
      req.user.sub,
      req.user.role,
      status,
      clientId,
      mechanicId,
      date,
    );
    
    this.logger.log(`✅ Se encontraron ${appointments.length} citas para el usuario ${req.user.sub}`);

    const data = req.user.role === ROLE.CLIENT
      ? appointments.map(appointment => toSafeAppointmentForClient(appointment))
      : appointments.map(appointment => toSafeAppointmentForMechanic(appointment));
    
    return {
      success: true,
      message: 'Appointments retrieved successfully',
      data,
    };
  }

  @Get(':id')
  public async getAppointment(@Param('id') id: number): Promise<ApiResponse<SafeAppointmentWithSimpleClient>> {
    const appointment = await this.appointmentsService.getAppointmentById(id);
    const data = toSafeAppointmentWithSimpleClient(appointment);
    return {
      success: true,
      message: 'Cita obtenida exitosamente',
      data
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RoleGuard)
  @Roles(ROLE.CLIENT)
  public async createAppointment(
    @Request() req: AuthRequest,
    @Body() createAppointmentDto: CreateAppointmentDto
  ): Promise<ApiResponse<SafeAppointmentWithSimpleClient>> {
    const appointment = await this.appointmentsService.createAppointment(req.user.sub, createAppointmentDto);
    const data = toSafeAppointmentWithSimpleClient(appointment);
    return {
      success: true,
      message: 'Cita agendada exitosamente',
      data
    };
  }

  @Patch(':id')
  public async updateAppointment(
    @Param('id') id: number,
    @Request() req: AuthRequest,
    @Body() updateAppointmentDto: UpdateAppointmentDto
  ): Promise<ApiResponse<SafeAppointmentWithSimpleClient>> {
    const appointment = await this.appointmentsService.updateAppointment(
      id,
      req.user.sub,
      req.user.role,
      updateAppointmentDto
    );
    const data = toSafeAppointmentWithSimpleClient(appointment);
    return {
      success: true,
      message: 'Cita actualizada exitosamente',
      data
    };
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles(ROLE.CLIENT)
  public async deleteAppointment(
    @Param('id') id: number,
    @Request() req: AuthRequest
  ): Promise<ApiResponse<null>> {
    await this.appointmentsService.deleteAppointment(id, req.user.sub);
    return {
      success: true,
      message: 'Cita cancelada exitosamente',
      data: null
    };
  }
}
