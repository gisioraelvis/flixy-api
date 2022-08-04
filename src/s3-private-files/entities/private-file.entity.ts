import { User } from 'src/user/entities/user.entity';

class PrivateFile {
  public id: number;
  public key: string;
  public owner: User;
}

export default PrivateFile;
