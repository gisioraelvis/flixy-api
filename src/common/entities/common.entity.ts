import { Column, PrimaryGeneratedColumn } from 'typeorm';

export class CommonEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
  @Column({ type: 'timestamp', nullable: true, default: null })
  updatedAt: Date | null;
}
