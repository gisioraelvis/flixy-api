import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
class Log {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ default: 'debug' })
  public context: string;

  @Column()
  public message: string;

  @Column()
  public level: string;
}

export default Log;
