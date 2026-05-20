import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class RemindersService {
  constructor(
    @InjectQueue('reminders') private readonly queue: Queue,
    private readonly config: ConfigService,
  ) {}

  async scheduleAppointment(appointmentId: string, startAt: Date): Promise<string | null> {
    const lead = Number(this.config.get('REMINDER_LEAD_MINUTES') ?? 1440);
    const delay = startAt.getTime() - Date.now() - lead * 60_000;
    if (delay <= 0) return null;
    const job = await this.queue.add(
      'appointment-reminder',
      { appointmentId },
      { delay, removeOnComplete: true, attempts: 3, backoff: { type: 'exponential', delay: 30_000 } },
    );
    return job.id ?? null;
  }

  async cancelJob(jobId: string | null | undefined) {
    if (!jobId) return;
    const job = await this.queue.getJob(jobId);
    await job?.remove().catch(() => undefined);
  }
}
