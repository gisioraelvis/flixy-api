import { CommonEntity } from 'src/common/entities/common.entity';
import { Column, Entity } from 'typeorm';

@Entity()
class Log extends CommonEntity {
  @Column()
  public context: string;

  @Column()
  public message: string;

  @Column()
  public level: string;
}

export default Log;
